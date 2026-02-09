from .schemas import QuestionPayload
from .static_cache import cache_instance
from ..inference.client import run_inference
from ..utils.question_utils import is_compound_question

router = APIRouter()

@router.post("/answer")
async def answer_question(payload: QuestionPayload, request: Request):
    static_cache = cache_instance

    cached, score = static_cache.find(
        payload.question,
        subject=payload.subject
    )

    def get_answer(item):
        """Selects the correct answer based on the requested mode."""
        return item.get("guided_mode_answer") if payload.mode == "guided" else item.get("exam_mode_answer")

    # --------------------
    # CASE 1: EXACT MATCH
    # --------------------
    if (
        cached
        and score >= 0.85
        and not is_compound_question(cached["question"])
    ):
        return {
            "status": "cache_exact",
            "message": "Found a very close match in our exam question cache.",
            "input_question": payload.question,
            "matched_question": cached["question"],
            "subject": cached["subject"],
            "marks": cached["marks"],
            "mode_used": payload.mode,
            "confidence": round(score, 2),
            "answer": get_answer(cached),
        }

    # ----------------------
    # CASE 2: SIMILAR MATCH
    # ----------------------
    if cached and score >= 0.60:
        if payload.enable_inference:
            inference = run_inference(
                payload.question,
                payload.mode,
                payload.subject,
                payload.marks
            )

            if inference.get("status") == "inference_failed":
                return {
                    "status": "inference_failed",
                    "message": f"Inference service failed: {inference.get('error', 'unknown error')}",
                    "input_question": payload.question,
                    "confidence": round(score, 2),
                }

            return {
                "status": "inference_used",
                "message": "Generated an exact answer using live inference.",
                "input_question": payload.question,
                "mode_used": payload.mode,
                "confidence": round(score, 2),
                "answer": inference.get("answer"),
            }

        return {
            "status": "cache_similar",
            "message": (
                "We found a similar exam question. "
                "Enable inference to generate an exact answer."
            ),
            "input_question": payload.question,
            "matched_question": cached["question"],
            "subject": cached["subject"],
            "marks": cached["marks"],
            "confidence": round(score, 2),
            "mode_used": payload.mode,
            "answer": get_answer(cached),
            "next_step": {
                "action": "enable_inference",
                "hint": "Resubmit with enable_inference=true"
            }
        }

    # -------------------
    # CASE 3: CACHE MISS
    # -------------------
    inference = run_inference(
        payload.question,
        payload.mode,
        payload.subject,
        payload.marks
    )

    if inference.get("status") == "inference_failed":
        return {
            "status": "cache_miss",
            "message": (
                "No cache match found and inference is currently unavailable."
            ),
            "input_question": payload.question,
        }

    return {
        "status": "inference_used",
        "message": "No cache match found. Generated answer using inference.",
        "input_question": payload.question,
        "mode_used": payload.mode,
        "answer": inference.get("answer"),
    }
