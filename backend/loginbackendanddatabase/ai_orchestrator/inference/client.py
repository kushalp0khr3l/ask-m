import requests
import os

KAGGLE_INFER_URL = os.getenv("KAGGLE_INFER_URL")
# Fallback for local development or general inference
INFERENCE_URL = os.getenv("INFERENCE_URL", "http://localhost:9000")

def run_inference(question: str, mode: str, subject: str | None = None, marks: int | None = None):
    """
    Calls the Kaggle-hosted fine-tuned model or local fallback.
    """
    url = KAGGLE_INFER_URL or f"{INFERENCE_URL}/generate"
    
    payload = {
        "question": question,
        "mode": mode,
        "subject": subject,
        "marks": marks,
    }

    try:
        resp = requests.post(
            url,
            json=payload,
            timeout=120  # Increased timeout for LLM inference
        )
        if resp.status_code != 200:
            return {"status": "inference_failed", "error": f"HTTP {resp.status_code}"}
            
        return {
            "status": "ok",
            "answer": resp.json().get("answer")
        }

    except Exception as e:
        return {
            "status": "inference_failed",
            "error": str(e)
        }
