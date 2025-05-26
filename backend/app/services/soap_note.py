import os
from typing import Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai
from ..models.soap import SOAPNote

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
    return f"""You are a medical scribe assistant. Your task is to generate a detailed SOAP note from the following medical consultation transcript.

Format the response exactly as follows:
Subjective: [Patient's reported symptoms and history]
Objective: [Clinical observations and measurements]
Assessment: [Diagnosis and clinical reasoning]
Plan: [Treatment plan and follow-up]

Medical Consultation Transcript:
{transcription}

Generate a SOAP note that captures all relevant medical information from the transcript. Ensure the response follows the exact format specified above."""

def format_section_markdown(text: str) -> str:
    """
    Format a section as Markdown: lists as bullets, narrative as paragraphs.
    """
    import re
    text = text.strip()
    if not text:
        return "_No information provided in this section._"

    # Replace inline bullets/asterisks with newlines
    text = re.sub(r'\s*([\*•\-])\s+', r'\n\1 ', text)
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if not lines:
        return "_No information provided in this section._"

    # If most lines start with a bullet or number, preserve as list
    bullet_like = sum(1 for l in lines if re.match(r'^(-|\*|\d+\.|•)', l))
    if bullet_like >= len(lines) / 2:
        return '\n'.join(lines)

    # If most lines are very short (less than 60 chars), treat as a list
    short_lines = sum(1 for l in lines if len(l) < 60)
    if len(lines) > 1 and short_lines >= len(lines) / 2:
        return '\n'.join(f'- {l.lstrip("-•* ")}' for l in lines)

    # Otherwise, join as a paragraph
    return ' '.join(lines)

async def generate_soap_note(transcription: str) -> Dict[str, Any]:
    """
    Generate a SOAP note from the transcription using Google's Gemini API
    """
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Generate the response
        response = model.generate_content(
            generate_soap_prompt(transcription),
            generation_config=genai.types.GenerationConfig(
                temperature=TEMPERATURE,
                max_output_tokens=MAX_TOKENS,
                top_p=0.9,
                top_k=40
            )
        )
        
        # Get the generated text
        generated_text = response.text
        
        # Parse the response and extract SOAP sections
        sections = {
            "subjective": "",
            "objective": "",
            "assessment": "",
            "plan": ""
        }
        
        current_section = None
        for line in generated_text.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('Subjective:'):
                current_section = 'subjective'
                sections['subjective'] = line.replace('Subjective:', '').strip()
            elif line.startswith('Objective:'):
                current_section = 'objective'
                sections['objective'] = line.replace('Objective:', '').strip()
            elif line.startswith('Assessment:'):
                current_section = 'assessment'
                sections['assessment'] = line.replace('Assessment:', '').strip()
            elif line.startswith('Plan:'):
                current_section = 'plan'
                sections['plan'] = line.replace('Plan:', '').strip()
            elif current_section and line:
                sections[current_section] += ' ' + line

        # Format each section as Markdown for best frontend rendering
        for section in sections:
            sections[section] = format_section_markdown(sections[section])

        # Validate that all sections have content
        for section, content in sections.items():
            if not content:
                sections[section] = "- No information provided in this section."

        # Calculate a simple confidence score based on content length and section presence
        confidence_score = min(0.95, 0.5 + (len(generated_text) / 2000))

        return {
            "subjective": sections["subjective"],
            "objective": sections["objective"],
            "assessment": sections["assessment"],
            "plan": sections["plan"],
            "confidence_score": confidence_score,
            "source_segments": []  # You can implement source tracking if needed
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