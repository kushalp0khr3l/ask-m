def choose_mode(payload: dict) -> str:
    """
    payload example:
      {"subject": "...", "question": "...", "marks": 4, "mode": "auto"}
    """
    mode = (payload.get("mode") or "auto").lower()
    if mode in {"exam", "guided"}:
        return mode

    # auto routing heuristic:
    marks = payload.get("marks")
    if isinstance(marks, (int, float)) and marks <= 2:
        return "exam"     # short answers
    return "guided"       # explain more
