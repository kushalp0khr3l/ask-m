from pydantic import BaseModel
from typing import Optional

class QuestionPayload(BaseModel):
    question: str
    subject: Optional[str] = None
    marks: Optional[int] = None
    mode: str = "exam"          # exam | guided
    enable_inference: bool = False
