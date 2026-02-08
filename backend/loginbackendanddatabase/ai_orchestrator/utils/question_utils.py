def is_compound_question(question: str) -> bool:
    """
    Detects multi-part exam questions.
    """
    q = question.lower()

    indicators = [
        " and ",
        " also ",
        " mention ",
        " explain",
        " discuss",
        ";",
        ":",
    ]

    return any(token in q for token in indicators)
