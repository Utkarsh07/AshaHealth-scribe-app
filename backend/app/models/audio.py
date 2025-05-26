from pydantic import BaseModel
from typing import Optional

class AudioResponse(BaseModel):
    success: bool
    transcription: Optional[str] = None
    message: str 