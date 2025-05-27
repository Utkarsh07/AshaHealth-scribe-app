from pydantic import BaseModel
from typing import Optional, List

class TranscriptionRequest(BaseModel):
    text: str

class SourceSegment(BaseModel):
    text: str
    source_text: str 
    start_index: int
    end_index: int
    section: str

class SOAPNote(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    confidence_score: float
    source_segments: List[SourceSegment] = []  # List of source segments for each line 