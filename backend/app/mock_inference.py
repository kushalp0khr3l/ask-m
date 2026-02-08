from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class InferencePayload(BaseModel):
    question: str
    mode: str = "exam"
    subject: str | None = None
    marks: int | None = None

@app.post("/generate")
def generate_answer(payload: InferencePayload):
    return {
        "status": "ok",
        "answer": f"[MOCK INFERENCE ANSWER]\n\n{payload.question}"
    }
