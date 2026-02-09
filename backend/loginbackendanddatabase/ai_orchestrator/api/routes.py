from fastapi import APIRouter, Request
from .schemas import QuestionPayload
from ..inference.client import run_inference
from ..utils.question_utils import is_compound_question

router = APIRouter()

@router.post("/answer")
async def answer_question(payload: QuestionPayload, request: Request):
    # ==================================================
    # QUICK GREETING HANDLER
    # ==================================================
    greetings = ["hi", "hello", "hey", "hola", "namaste"]
    if payload.question.lower().strip() in greetings:
        return {
            "status": "cache_exact",
            "message": "Friendly greeting detected.",
            "answer": "Hello! I'm Ask-M, your Kathmandu University syllabus assistant. How can I help you today?",
            "confidence": 1.0
        }

    static_cache = request.app.state.static_cache

    cached, score = static_cache.find(
        payload.question,
        subject=payload.subject
    )

    # ==================================================
    # CASE 1: EXACT MATCH (SAFE CACHE HIT)
    # ==================================================
    if (
        cached
        and score >= 0.85
        and not is_compound_question(cached["question"])
    ):
        answer = (
            cached.get("guided_mode_answer")
            if payload.mode == "guided"
            else cached.get("exam_mode_answer")
        )

        if answer:
            return {
                "status": "cache_exact",
                "message": "Exact exam question found in cache.",
                "input_question": payload.question,
                "matched_question": cached["question"],
                "subject": cached["subject"],
                "marks": cached["marks"],
                "mode_used": payload.mode,
                "confidence": round(score, 2),
                "answer": answer,
            }

    # ==================================================
    # CASE 2: SIMILAR MATCH
    # ==================================================
    if cached and score >= 0.60:
        if not payload.enable_inference:
            return {
                "status": "cache_similar",
                "message": "Similar exam question found. Enable inference for exact answer.",
                "input_question": payload.question,
                "matched_question": cached["question"],
                "subject": cached["subject"],
                "marks": cached["marks"],
                "confidence": round(score, 2),
                "mode_used": payload.mode,
                "answer": cached.get("exam_mode_answer") or cached.get("guided_mode_answer"),
                "next_step": {
                    "action": "enable_inference",
                    "hint": "Resubmit with enable_inference=true"
                }
            }

        # Case: Similar match + Inference enabled
        inference = run_inference(
            question=payload.question,
            mode=payload.mode,
            subject=payload.subject or cached["subject"],
            marks=payload.marks or cached["marks"],
        )

        if inference.get("status") == "inference_failed":
            return {
                "status": "inference_failed",
                "message": f"Inference service failed: {inference.get('error', 'unknown error')}",
                "input_question": payload.question,
                "confidence": round(score, 2),
            }

        # PERSIST: Save the AI's answer back to cache for future instant hits
        static_cache.save_or_update({
            "subject": payload.subject or cached["subject"],
            "question": payload.question,
            "marks": payload.marks or cached["marks"],
            "exam_mode_answer": inference["answer"] if payload.mode == "exam" else None,
            "guided_mode_answer": inference["answer"] if payload.mode == "guided" else None,
            "keywords": [],
        })

        return {
            "status": "inference_used",
            "message": "Generated exact answer using live inference and cached the result.",
            "confidence": round(score, 2),
            "mode_used": payload.mode,
            "answer": inference["answer"],
            "cached": True,
        }

    # ==================================================
    # CASE 3: CACHE MISS
    # ==================================================
    inference = run_inference(
        question=payload.question,
        mode=payload.mode,
        subject=payload.subject,
        marks=payload.marks,
    )

    if inference.get("status") == "inference_failed":
        return {
            "status": "cache_miss",
            "message": "No cache match found and inference service is currently unavailable.",
            "input_question": payload.question,
        }

    # PERSIST: Cache the result even on total miss
    static_cache.save_or_update({
        "subject": payload.subject or "general",
        "question": payload.question,
        "marks": payload.marks or 5,
        "exam_mode_answer": inference["answer"] if payload.mode == "exam" else None,
        "guided_mode_answer": inference["answer"] if payload.mode == "guided" else None,
        "keywords": [],
    })

    return {
        "status": "inference_used",
        "message": "No match found. Generated and cached a new answer using inference.",
        "mode_used": payload.mode,
        "answer": inference["answer"],
        "cached": True,
    }
