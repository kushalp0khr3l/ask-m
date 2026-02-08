''' Output:
794
dict_keys(['subject', 'question', 'mark', 'paper_type', 'section', 'semester', 'family'])
'''
import os
import json

BASE_DIR = ""      # root folder
OUTPUT_FILE = "merged_dataset.json"

SEM_FOLDERS = [
    "1st Sem",
    "2nd Sem",
    "3rd Sem"
]

def merge_all_jsons():
    merged = []
    file_count = 0
    item_count = 0

    for sem in SEM_FOLDERS:
        sem_path = os.path.join(BASE_DIR, sem)

        if not os.path.isdir(sem_path):
            print(f"Skipping missing folder: {sem_path}")
            continue

        for fname in os.listdir(sem_path):
            if not fname.endswith(".json"):
                continue

            file_path = os.path.join(sem_path, fname)

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if not isinstance(data, list):
                    print(f"Skipping non-list JSON: {file_path}")
                    continue

                merged.extend(data)
                file_count += 1
                item_count += len(data)

            except Exception as e:
                print(f"Failed to read {file_path}: {e}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        json.dump(merged, out, indent=2, ensure_ascii=False)

    print(f"Merge complete.")
    print(f"Files merged: {file_count}")
    print(f"Total items: {item_count}")
    print(f"Output file: {OUTPUT_FILE}")


if __name__ == "__main__":
    merge_all_jsons()
