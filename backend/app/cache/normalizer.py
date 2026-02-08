import re

STOPWORDS = {
    "the", "is", "a", "an", "of", "to", "and", "from",
    "using", "with", "what", "explain", "here"
}

def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\[[^\]]*\]", " ", text)   # remove [1+3]
    text = re.sub(r"[^a-z\s]", " ", text)     # remove punctuation/numbers
    text = re.sub(r"\s+", " ", text).strip()
    return text

def tokenize(text: str) -> set[str]:
    return {
        t for t in normalize(text).split()
        if t not in STOPWORDS and len(t) > 2
    }
