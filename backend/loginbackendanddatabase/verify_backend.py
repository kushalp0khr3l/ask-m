import requests
import json

BASE_URL = "http://localhost:8000"

def test_root():
    print("\n--- Testing Root ---")
    try:
        resp = requests.get(f"{BASE_URL}/")
        print(resp.json())
    except Exception as e:
        print(f"Error: {e}")

def test_exact_match():
    print("\n--- Testing Exact Match ---")
    payload = {
        "question": "What is a priority queue?",
        "subject": "COMP 202",
        "mode": "exam"
    }
    try:
        resp = requests.post(f"{BASE_URL}/answer", json=payload)
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

def test_similar_match():
    print("\n--- Testing Similar Match ---")
    payload = {
        "question": "Tell me about priority queues and their usage",
        "subject": "COMP 202",
        "mode": "guided"
    }
    try:
        resp = requests.post(f"{BASE_URL}/answer", json=payload)
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

def test_inference_after_similar():
    print("\n--- Testing Inference Trigger ---")
    payload = {
        "question": "Tell me about priority queues and their usage",
        "subject": "COMP 202",
        "mode": "guided",
        "enable_inference": True
    }
    try:
        resp = requests.post(f"{BASE_URL}/answer", json=payload)
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Ensure the backend is running at http://localhost:8000")
    test_root()
    test_exact_match()
    test_similar_match()
    test_inference_after_similar()
