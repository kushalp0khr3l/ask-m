import json
from pathlib import Path

# -------- CONFIG --------
INPUT_FILE = "expanded_dataset.jsonl"   #777-record file
OUTPUT_DIR = Path("splitted_datasets")

OUTPUT_DIR.mkdir(exist_ok=True)

exam_out = open(OUTPUT_DIR / "exam_lora.jsonl", "w", encoding="utf-8")
exam_fu_out = open(OUTPUT_DIR / "exam_followup_lora.jsonl", "w", encoding="utf-8")
guided_out = open(OUTPUT_DIR / "guided_lora.jsonl", "w", encoding="utf-8")
guided_fu_out = open(OUTPUT_DIR / "guided_followup_lora.jsonl", "w", encoding="utf-8")

# -------- HELPERS --------
def write_jsonl(fp, obj):
    fp.write(json.dumps(obj, ensure_ascii=False) + "\n")

# -------- PROCESS --------
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    for line in f:
        record = json.loads(line)

        subject = record.get("subject", "").strip()
        question = record.get("question", "").strip()
        marks = record.get("marks")
        keywords = record.get("keywords", [])

        # ---------- 1. EXAM LORA ----------
        if question and record.get("exam_mode_answer"):
            write_jsonl(exam_out, {
                "instruction": (
                    f"You are an exam-answering assistant. "
                    f"Write an answer appropriate for a {marks}-mark question. "
                    f"Be clear, correct, and concise. Do not add follow-up questions."
                ),
                "input": (
                    f"Subject: {subject}\n"
                    f"Marks: {marks}\n"
                    f"Question: {question}"
                ),
                "output": record["exam_mode_answer"].strip(),
                "meta": {
                    "subject": subject,
                    "marks": marks,
                    "keywords": keywords
                }
            })

        # ---------- 2. EXAM FOLLOW-UP LORA ----------
        if record.get("exam_f_question") and record.get("exam_mode_answer"):
            write_jsonl(exam_fu_out, {
                "instruction": (
                    "Generate exam-style follow-up questions that test understanding "
                    "of the given answer. Do not provide answers."
                ),
                "input": (
                    f"Subject: {subject}\n"
                    f"Original Marks: {marks}\n"
                    f"Original Question: {question}\n"
                    f"Exam Answer: {record['exam_mode_answer'].strip()}"
                ),
                "output": f"1. {record['exam_f_question'].strip()}",
                "meta": {
                    "subject": subject,
                    "marks": marks,
                    "keywords": keywords
                }
            })

        # ---------- 3. GUIDED LORA ----------
        if question and record.get("guided_mode_answer"):
            write_jsonl(guided_out, {
                "instruction": (
                    "You are a tutor. Explain the concept clearly and step-by-step "
                    "for learning. Use simple language and structure the explanation well."
                ),
                "input": (
                    f"Subject: {subject}\n"
                    f"Question: {question}"
                ),
                "output": record["guided_mode_answer"].strip(),
                "meta": {
                    "subject": subject,
                    "marks": marks,
                    "keywords": keywords
                }
            })

        # ---------- 4. GUIDED FOLLOW-UP LORA ----------
        if record.get("guided_f_question") and record.get("guided_mode_answer"):
            write_jsonl(guided_fu_out, {
                "instruction": (
                    "Generate learning-focused follow-up questions based on the explanation. "
                    "Do not provide answers."
                ),
                "input": (
                    f"Subject: {subject}\n"
                    f"Explanation: {record['guided_mode_answer'].strip()}"
                ),
                "output": record["guided_f_question"].strip(),
                "meta": {
                    "subject": subject,
                    "marks": marks,
                    "keywords": keywords
                }
            })

# -------- CLEANUP --------
exam_out.close()
exam_fu_out.close()
guided_out.close()
guided_fu_out.close()

print("Dataset splitting complete.")
print(f"Output directory: {OUTPUT_DIR.resolve()}")
