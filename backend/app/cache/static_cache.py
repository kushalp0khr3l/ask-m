import json
from pathlib import Path
from .matcher import overlap_score, keyword_boost
from .normalizer import normalize

DATASET_PATH = Path("data/expanded_dataset.jsonl")

class StaticCache:
    def __init__(self):
        self.items = []

    def load(self):
        self.items = []
        with DATASET_PATH.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                self.items.append(json.loads(line))

    def save_entry(self, entry: dict):
        """
        Append a new entry to cache (JSONL-safe) and memory
        """
        # Avoid exact duplicate questions
        for item in self.items:
            if normalize(item["question"]) == normalize(entry["question"]):
                return  # already cached

        self.items.append(entry)

        with DATASET_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def _mandatory_token_gate(self, query: str, item_question: str) -> bool:
        q = normalize(query)
        iq = normalize(item_question)

        mandatory_tokens = ["priority"]

        for token in mandatory_tokens:
            if token in q and token not in iq:
                return False

        return True

    def find(self, question: str, subject: str | None = None):
        best = None
        best_score = 0.0

        for item in self.items:
            if subject and item.get("subject") != subject:
                continue

            if not self._mandatory_token_gate(question, item["question"]):
                continue

            score = overlap_score(question, item["question"])
            score += keyword_boost(question, item.get("keywords", []))
            score = min(score, 1.0)

            if score > best_score:
                best = item
                best_score = score

        if best_score >= 0.6:
            return best, best_score

        return None, 0.0
