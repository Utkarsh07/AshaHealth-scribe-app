# Asha Health AI Medical Scribe

An AI-powered medical scribe system that automatically generates SOAP notes from doctor-patient conversations.

## Features

- Real-time audio recording of medical consultations
- Automatic transcription using Deepgram API
- AI-powered SOAP note generation
- Support for 30-40 minute conversations
- Low-latency processing
- Audio file upload support

## Tech Stack

- Frontend: React
- Backend: FastAPI
- Audio Processing: Deepgram API
- AI Note Generation: Google Gemini 2.0 Flash

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate 
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

5. Run the backend server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run the development server:
```bash
npm start
```
