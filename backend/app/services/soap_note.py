import os
from typing import Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai
from ..models.soap import SOAPNote
import re
import difflib

load_dotenv()

# Environment variables with defaults
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.3"))
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "2000"))

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

# Configure the Gemini API
genai.configure(api_key=GOOGLE_API_KEY)

def generate_soap_prompt(transcription: str) -> str:
    return f"""You are a highly skilled medical clinician. Your task is to generate a concise, clinically relevant SOAP note from the following medical consultation transcript, following best practices for medical documentation.

SOAP Note Best Practices:
- Only include information that is medically relevant and necessary for clinical care.
- Summarize and synthesize information; do not copy the transcript verbatim.
- Avoid repetition, filler, or non-medical commentary.
- Use clear, professional, and concise language.
- Each section should be focused and to the point.
- If information is repeated in the transcript, only include it once in the SOAP note.

Formatting Instructions and Definitions:
- Format the response exactly as follows:
Subjective: [Patient's reported symptoms and medical history]
Objective: [Clinical observations and measurements, including vital signs, physical exam findings, and other relevant data]
Assessment: [Diagnosis and clinical reasoning]
Plan: [Treatment plan and follow-up, including tests, treatments, and follow-up appointments]

- For EVERY SINGLE LINE in your response, you MUST provide the exact source text from the transcript that supports that information. NO LINE should be without a <source>...</source> tag. If a line is a summary or synthesis, use the most relevant supporting transcript text within <source>...</source>.

Example (CORRECT):
* Patient reports feeling tired. <source>I have been feeling quite tired and...</source>
* Patient denies smoking. <source>No, I'm not a smoker...</source>

Example (INCORRECT):
* Patient reports feeling tired.
* Patient denies smoking. <source>No, I'm not a smoker...</source>

Medical Consultation Transcript:
{transcription}

Generate a SOAP note that captures all relevant medical information from the transcript. Ensure the response follows the exact format specified above, including source text mapping for each line. Make the SOAP note concise, clinically relevant, and free of non-medical commentary or unnecessary detail."""

async def generate_soap_note(transcription: str) -> Dict[str, Any]:
    """
    Generate a SOAP note from the transcription using Google's Gemini API
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(
            generate_soap_prompt(transcription),
            generation_config=genai.types.GenerationConfig(
                temperature=TEMPERATURE,
                max_output_tokens=MAX_TOKENS,
                top_p=0.9,
                top_k=40
            )
        )
        generated_text = response.text
        print('LLM OUTPUT:', generated_text)  # Log the raw LLM output for debugging

        section_headers = ['Subjective:', 'Objective:', 'Assessment:', 'Plan:']
        section_map = {'Subjective:': 'subjective', 'Objective:': 'objective', 'Assessment:': 'assessment', 'Plan:': 'plan'}
        current_section = None
        section_lines = {'subjective': [], 'objective': [], 'assessment': [], 'plan': []}
        source_segments = []
        first_line_seen = {k: False for k in section_lines}
        line_to_source = []  # To keep track of (section, line, source_text)

        for line in generated_text.split('\n'):
            line = line.strip()
            if not line:
                continue
            # Section header detection
            matched_header = None
            for header in section_headers:
                if line.startswith(header):
                    matched_header = header
                    break
            if matched_header:
                current_section = section_map[matched_header]
                line = line[len(matched_header):].strip()
                first_line_seen[current_section] = False
                if not line:
                    continue
            if not current_section or not line:
                continue
            # Remove [ ... ] from the first line of each section
            if not first_line_seen[current_section]:
                if line.startswith('['):
                    continue
                line = re.sub(r'^\[.*?\]\s*', '', line)
                first_line_seen[current_section] = True
            # Find all note <source>source</source> pairs
            pattern = r'(?P<note>.*?)<source>(?P<source>.*?)</source>'
            matches = list(re.finditer(pattern, line))
            if matches:
                for match in matches:
                    note_text = match.group('note').strip().lstrip('-*•').strip()
                    source_text = match.group('source').strip()
                    if note_text:
                        section_lines[current_section].append(note_text)
                        start_index = transcription.find(source_text)
                        if start_index != -1:
                            source_segments.append({
                                'text': note_text,
                                'source_text': source_text,
                                'start_index': start_index,
                                'end_index': start_index + len(source_text),
                                'section': current_section
                            })
                        else:
                            # If source_text not found, still add with NO MATCH FOUND
                            source_segments.append({
                                'text': note_text,
                                'source_text': source_text + ' (NOT FOUND IN TRANSCRIPT)',
                                'start_index': -1,
                                'end_index': -1,
                                'section': current_section
                            })
                    line_to_source.append((current_section, note_text, source_text))
            else:
                clean_line = line.lstrip('-*•').strip()
                if clean_line:
                    section_lines[current_section].append(clean_line)
                    line_to_source.append((current_section, clean_line, None))

        # Fuzzy match for lines missing a source
        transcript_lines = [l.strip() for l in transcription.split('\n') if l.strip()]
        for idx, (section, note_text, source_text) in enumerate(line_to_source):
            if source_text is not None:
                continue  # Already has a source
            # Fuzzy match
            best_match = difflib.get_close_matches(note_text, transcript_lines, n=1, cutoff=0.5)
            if best_match:
                match_text = best_match[0]
                start_index = transcription.find(match_text)
                source_segments.append({
                    'text': note_text,
                    'source_text': match_text,
                    'start_index': start_index,
                    'end_index': start_index + len(match_text),
                    'section': section
                })
            else:
                source_segments.append({
                    'text': note_text,
                    'source_text': 'NO MATCH FOUND',
                    'start_index': -1,
                    'end_index': -1,
                    'section': section
                })

        # Build the final sections as markdown lists if multiple lines, or as a paragraph if only one
        sections = {}
        for section, lines in section_lines.items():
            if len(lines) > 1:
                sections[section] = '\n'.join([f'* {l}' for l in lines])
            elif lines:
                sections[section] = lines[0]
            else:
                sections[section] = '- No information provided in this section.'

        confidence_score = min(0.95, 0.5 + (len(generated_text) / 2000))

        return {
            "subjective": sections["subjective"],
            "objective": sections["objective"],
            "assessment": sections["assessment"],
            "plan": sections["plan"],
            "confidence_score": confidence_score,
            "source_segments": source_segments
        }

    except Exception as e:
        print(f"Error generating SOAP note: {e}")
        raise Exception(f"Failed to generate SOAP note: {str(e)}")

def validate_soap_note(soap_note: SOAPNote) -> bool:
    """
    Validate the generated SOAP note
    """
    required_sections = ["subjective", "objective", "assessment", "plan"]
    
    # Check if all required sections are present and not empty
    for section in required_sections:
        if not getattr(soap_note, section) or len(getattr(soap_note, section).strip()) == 0:
            return False
    
    # Check confidence score
    if not 0 <= soap_note.confidence_score <= 1:
        return False
    
    return True 