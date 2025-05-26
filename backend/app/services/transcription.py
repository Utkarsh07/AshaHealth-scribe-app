from deepgram import Deepgram
import os
from dotenv import load_dotenv
import asyncio
from typing import Optional
import aiofiles
import tempfile

load_dotenv()

# Environment variables with defaults
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
MAX_AUDIO_DURATION = int(os.getenv("MAX_AUDIO_DURATION", "2400"))  # 40 minutes default
AUDIO_FORMAT = os.getenv("AUDIO_FORMAT", "wav")
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "16000"))

if not DEEPGRAM_API_KEY:
    raise ValueError("DEEPGRAM_API_KEY environment variable is not set")

dg_client = Deepgram(DEEPGRAM_API_KEY)

async def transcribe_audio(file) -> str:
    """
    Transcribe audio file using Deepgram API
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{AUDIO_FORMAT}") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Configure Deepgram options
        options = {
            "smart_format": True,
            "model": "nova-2",
            "language": "en-US",
            "diarize": True,
            "punctuate": True,
            "utterances": True,
            "sample_rate": SAMPLE_RATE,
        }

        # Open the audio file
        async with aiofiles.open(temp_file_path, "rb") as audio:
            source = {"buffer": await audio.read(), "mimetype": f"audio/{AUDIO_FORMAT}"}
            
            # Send to Deepgram
            response = await dg_client.transcription.prerecorded(source, options)
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            
            # Process and format the transcription
            transcription = format_transcription(response)
            return transcription

    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")

def format_transcription(response: dict) -> str:
    """
    Format the Deepgram response into a readable transcription
    """
    try:
        transcript = []
        for utterance in response["results"]["utterances"]:
            speaker = f"Speaker {utterance['speaker']}" if utterance.get('speaker') else "Unknown"
            transcript.append(f"{speaker}: {utterance['transcript']}")
        
        return "\n".join(transcript)
    except Exception as e:
        raise Exception(f"Failed to format transcription: {str(e)}")

async def stream_audio(audio_data: bytes) -> Optional[str]:
    """
    Stream audio data to Deepgram for real-time transcription
    """
    try:
        source = {"buffer": audio_data, "mimetype": f"audio/{AUDIO_FORMAT}"}
        response = await dg_client.transcription.prerecorded(source, {
            "smart_format": True,
            "model": "nova-2",
            "language": "en-US",
            "diarize": True,
            "punctuate": True,
            "sample_rate": SAMPLE_RATE,
        })
        return format_transcription(response)
    except Exception as e:
        print(f"Streaming transcription failed: {str(e)}")
        return None 