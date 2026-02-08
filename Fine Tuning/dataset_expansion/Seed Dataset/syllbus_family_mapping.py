import os
import json

#configuration file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SEMESTER_MAP = {
    "1st Sem": 1,
    "2nd Sem": 2,
    "3rd Sem": 3
}

FAMILY_MAP = {
    "PHYS": "math_phys",
    "MATH": "math_phys",
    "CHEM": "math_phys",
    "ENGG": "math_phys",
    "ENVE": "math_phys",
    "EEEG": "math_phys",
    "MCSC": "math_phys",

    "COMP": "programming",

    "EDRG": "design",
    "ENGT": "design"
}

#helpers
def infer_family(subject_code: str) -> str:
    """
    This extracts prefix from subject code and map to family.
    """
    prefix = "".join([c for c in subject_code if c.isalpha()])
    return FAMILY_MAP.get(prefix, "general")


def process_file(file_path: str, semester: int):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = False

    for item in data:
        # Add semester
        if "semester" not in item:
            item["semester"] = semester
            updated = True

        # Add family
        if "family" not in item:
            subject = item.get("subject", "")
            item["family"] = infer_family(subject)
            updated = True

    if updated:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated: {file_path}")
    else:
        print(f"⏭kipped (already clean): {file_path}")

#main
def run():
    print("\nLets Beginnnnnnnnnn\n")

    for sem_folder, semester in SEMESTER_MAP.items():
        sem_path = os.path.join(BASE_DIR, sem_folder)

        if not os.path.isdir(sem_path):
            print(f"Folder not found: {sem_path}")
            continue

        for filename in os.listdir(sem_path):
            if not filename.endswith(".json"):
                continue

            file_path = os.path.join(sem_path, filename)
            process_file(file_path, semester)

    print("\nDone. Files updated.\n")

if __name__ == "__main__":
    run()
