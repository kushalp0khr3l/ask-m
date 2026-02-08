import requests
import os

INFERENCE_URL = os.getenv("INFERENCE_URL", "http://localhost:9000")

def run_inference(question: str, mode: str, subject: str | None, marks: int | None):
    payload = {
        "question": question,
        "mode": mode,
        "subject": subject,
        "marks": marks,
    }

    try:
        resp = requests.post(
            f"{INFERENCE_URL}/generate",
            json=payload,
            timeout=60
        )
        resp.raise_for_status()
        return resp.json()

    except Exception as e:
        return {
            "status": "inference_failed",
            "error": str(e)
        }
