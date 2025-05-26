from pydantic import BaseModel
from typing import Optional, List

class TranscriptionRequest(BaseModel):
    text: str

class SOAPNote(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    confidence_score: float
    source_segments: Optional[List[dict]] = None  # For mapping note sections to transcript segments 