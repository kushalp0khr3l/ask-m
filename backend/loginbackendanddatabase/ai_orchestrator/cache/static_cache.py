import json
from pathlib import Path
from .matcher import overlap_score, keyword_boost
from .normalizer import normalize

# Path relative to this file's location
DATASET_PATH = Path(__file__).parent.parent.parent / "data" / "expanded_dataset.jsonl"

class StaticCache:
    def __init__(self):
        self.items = []

    def load(self):
        self.items = []
        
        # Possible paths to check (Vercel deployment can have different structures)
        possible_paths = [
            DATASET_PATH,
            Path(__file__).parent.parent.parent / "loginbackendanddatabase" / "data" / "expanded_dataset.jsonl",
            Path.cwd() / "data" / "expanded_dataset.jsonl",
            Path.cwd() / "backend" / "loginbackendanddatabase" / "data" / "expanded_dataset.jsonl"
        ]

        actual_path = None
        for p in possible_paths:
            if p.exists():
                actual_path = p
                break

        if not actual_path:
            print(f"WARNING: Dataset not found in any of: {[str(p.absolute()) for p in possible_paths]}")
            return

        print(f"DEBUG: Loading dataset from {actual_path.absolute()}")
        with actual_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    self.items.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"ERROR: Failed to parse line in dataset: {e}")
                    continue
        print(f"DEBUG: Loaded {len(self.items)} items into cache.")

    def _mandatory_token_gate(self, query: str, item_question: str) -> bool:
        """
        HARD SEMANTIC GATE:
        If query contains strong intent words, item must also contain them.
        """
        q = normalize(query)
        iq = normalize(item_question)

        # Add more tokens here later if needed
        mandatory_tokens = ["priority"]

        for token in mandatory_tokens:
            if token in q and token not in iq:
                return False

        return True

    def find(self, question: str, subject: str | None = None):
        best = None
        best_score = 0.0

        for item in self.items:
            # Subject guard
            if subject and item.get("subject") != subject:
                continue

            # Mandatory semantic gate (CRITICAL FIX)
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
