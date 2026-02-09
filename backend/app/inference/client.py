import requests
import os

KAGGLE_INFER_URL = os.getenv("KAGGLE_INFER_URL")  # we will set this in the .env file to point to our Kaggle inference endpoint

def run_inference(question, mode="exam", subject=None, marks=None):
    if not KAGGLE_INFER_URL:
        return {"status": "inference_failed"}

    try:
        resp = requests.post(
            KAGGLE_INFER_URL,
            json={
                "question": question,
                "mode": mode,
                "subject": subject,
                "marks": marks
            },
            timeout=120
        )

        if resp.status_code != 200:
            return {"status": "inference_failed"}

        return {
            "status": "ok",
            "answer": resp.json().get("answer")
        }

    except Exception as e:
        return {"status": "inference_failed"}
