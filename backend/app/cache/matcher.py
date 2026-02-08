from .normalizer import tokenize, normalize

def overlap_score(q1: str, q2: str) -> float:
    t1 = tokenize(q1)
    t2 = tokenize(q2)

    if not t1 or not t2:
        return 0.0

    return len(t1 & t2) / len(t1)

def keyword_boost(query: str, keywords: list[str]) -> float:
    q = normalize(query)
    hits = 0

    for kw in keywords:
        if kw.lower() in q:
            hits += 1

    return 0.15 * hits
