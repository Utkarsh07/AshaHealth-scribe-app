from fastapi import FastAPI, UploadFile, File, WebSocket, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from .services.transcription import transcribe_audio
from .services.soap_note import generate_soap_note
from .models.audio import AudioResponse
from .models.soap import SOAPNote, TranscriptionRequest

# Load environment variables
load_dotenv()

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(title="Asha Health AI Medical Scribe API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Asha Health AI Medical Scribe API"}

@app.post("/api/transcribe", response_model=AudioResponse)
async def transcribe_audio_file(file: UploadFile = File(...)):
    """
    Transcribe an uploaded audio file using Deepgram API
    """
    try:
        transcription = await transcribe_audio(file)
        return AudioResponse(
            success=True,
            transcription=transcription,
            message="Transcription completed successfully"
        )
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )

@app.post("/api/generate-soap", response_model=SOAPNote)
async def create_soap_note(request: TranscriptionRequest):
    """
    Generate a SOAP note from the transcription
    """
    try:
        soap_note = await generate_soap_note(request.text)
        return soap_note
    except Exception as e:
        print(f"Error generating SOAP note: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming
    """
    await websocket.accept()
    try:
        while True:
            audio_data = await websocket.receive_bytes()
            pass
    except Exception as e:
        print(f"Error in websocket: {e}")
        await websocket.close(code=1000, reason=str(e)) 