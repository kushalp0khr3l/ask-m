# export DEEPSEEK_API_KEY="sk-..." before running

import os
import json
import time
import re
import requests
from tqdm import tqdm

# ---------------- CONFIG ----------------

MODEL_NAME = "deepseek-chat" # currently using DeepSeek v3.2 chat model (non-thinking), not using reasoning as its note required. Also explicitly using deepseek as its trained on STEM datasets and its cheap
API_URL = "https://api.deepseek.com/chat/completions"

INPUT_FILE = "failed_seedsv1.json"
OUTPUT_FILE = "expanded_dataset.jsonl"
FAILED_FILE = "failed_seedsv2.json"
CHECKPOINT_FILE = "checkpoint.txt"

MAX_TOKENS_EXAM = 1200
MAX_TOKENS_GUIDED = 1000
TEMPERATURE = 0.2
REQUEST_DELAY = 1.5

API_KEY = os.environ.get("DEEPSEEK_API_KEY")
if not API_KEY:
    raise RuntimeError("DEEPSEEK_API_KEY not found in environment")

# ---------------- PROMPT PLACEHOLDERS ----------------

def get_prompt_math_phys_exam(item):
    return f"""
You are answering a Kathmandu University engineering exam question.

SUBJECT: {item['subject']}
SEMESTER: {item['semester']}
MARKS: {item['mark']}

QUESTION:
{item['question']}

ABSOLUTE RULES:
- Write ONLY the exam answer.
- Do NOT include headings, tags, or guided explanations.

MINIMUM STRUCTURE (MANDATORY FOR ALL MARKS):
1. State the relevant definition, law, or principle.
2. Show reasoning, derivation, or formula usage.
3. Conclude with a clear result or expression.

DEPTH ENFORCEMENT:
- Do NOT write only the final formula or result.
- Even low-mark answers must show method or logic.
- Skipping steps is NOT allowed if it harms understanding.

DERIVATION FLOW (USE WHEN APPLICABLE):
Here, its given that,
We know,
Now, by the definition of,
Substituting,
Then / Similarly,
We get,
Hence,

MARKS HANDLING:
- Marks control how many steps or how detailed the derivation is.
- Marks do NOT allow omission of logic or explanation.

IMPORTANT:
- Output ONLY the answer text.
- Do NOT add anything before or after.
"""

def get_prompt_math_phys_guided(item, exam_answer):
    return f"""
You are generating guided study material based on an exam answer.

SUBJECT: {item['subject']}
SEMESTER: {item['semester']}
QUESTION:
{item['question']}

EXAM ANSWER (for reference):
{exam_answer}

CRITICAL:
- Every tag below MUST appear exactly once.
- Do NOT output anything outside the tags.
- If something is not applicable, write "N/A".

TASKS:
1. Explain the concept at Beginner → Intermediate level.
2. Generate ONE exam follow-up question.
3. Generate THREE guided follow-up questions.
4. Extract 4–6 syllabus-level technical keywords.

----------OUTPUT FORMAT----------
<RESULT>

<EXAM_FOLLOWUP>
...
</EXAM_FOLLOWUP>

<GUIDED_MODE>
...
</GUIDED_MODE>

<GUIDED_FOLLOWUP>
1. ...
2. ...
3. ...
</GUIDED_FOLLOWUP>

<KEYWORDS>
term1, term2, term3, term4
</KEYWORDS>

</RESULT>
"""

def get_prompt_programming_exam(item):
    return f"""
You are answering a Kathmandu University programming exam question.

SUBJECT: {item['subject']}
SEMESTER: {item['semester']}
MARKS: {item['mark']}

QUESTION:
{item['question']}

ABSOLUTE RULES (DO NOT VIOLATE):
- Write ONLY the exam answer.
- Do NOT include headings, tags, metadata, or guided explanations.
- Write exactly as a KU student would write in exams.

DEPTH ENFORCEMENT (MANDATORY):
- If the question asks to LIST, STATE, or NAME:
  → EACH item MUST include a brief explanation (1–2 lines minimum).
  → Pure listing of names is NOT allowed.

- If the question asks to EXPLAIN:
  → Give definition + working + relevance.
  → One-line explanations are NOT allowed.

- If the question asks for EXAMPLES:
  → At least ONE correct code example is MANDATORY.
  → Examples must directly match the concept being explained.

MARKS HANDLING (IMPORTANT):
- Marks determine HOW MANY examples or how detailed the explanation is.
- Marks do NOT reduce the minimum explanation depth.
- Even 2–3 mark answers must explain concepts clearly.

CODE RULES:
- Use C / C++ syntax where applicable.
- Code must be minimal, correct, and relevant.
- Inline comments are allowed if they improve clarity.

SPECIAL RULE — COMPARISON QUESTIONS:
- If the question asks to compare, differentiate, or distinguish:
  → Answer MUST be in TABULAR FORM.
  → Use plain text table with clear column headers.
  → No paragraph-style comparison allowed.

IMPORTANT:
- Output ONLY the answer text.
- Do NOT add anything before or after.
"""


def get_prompt_programming_guided(item, exam_answer):
    return f"""
You are generating guided study material based on an exam answer.

SUBJECT: {item['subject']}
SEMESTER: {item['semester']}
QUESTION:
{item['question']}

EXAM ANSWER (for reference):
{exam_answer}

CRITICAL:
- Every tag below MUST appear exactly once.
- Do NOT output anything outside the tags.
- If something is not applicable, write "N/A".

TASKS:
1. Explain the concept at Beginner → Intermediate level.
2. Generate ONE exam follow-up question.
3. Generate THREE guided follow-up questions.
4. Extract 4–6 syllabus-level technical keywords.

----------OUTPUT FORMAT----------
<RESULT>

<EXAM_FOLLOWUP>
...
</EXAM_FOLLOWUP>

<GUIDED_MODE>
...
</GUIDED_MODE>

<GUIDED_FOLLOWUP>
1. ...
2. ...
3. ...
</GUIDED_FOLLOWUP>

<KEYWORDS>
term1, term2, term3, term4
</KEYWORDS>

</RESULT>
"""

def get_prompt_design_exam(item):
    return f"""
You are answering a Kathmandu University engineering drawing / design exam question.

SUBJECT: {item['subject']}
SEMESTER: {item['semester']}
MARKS: {item['mark']}
PAPER TYPE: {item.get('paper_type', 'N/A')}
SECTION: {item.get('section', 'N/A')}

QUESTION:
{item['question']}

ABSOLUTE RULES:
- Write ONLY the exam answer.
- Do NOT include headings, tags, or guided explanations.
- Do NOT draw diagrams.

DEPTH ENFORCEMENT (MANDATORY):
- Every step, rule, standard, or convention mentioned MUST be briefly explained.
- Do NOT list steps or standards without stating their purpose.

MARKS HANDLING:
- Marks decide number of steps or comparisons.
- Marks do NOT remove the need for explanation.

SPECIAL RULE — COMPARISON QUESTIONS:
- If the question asks to compare, differentiate, or distinguish:
  → Answer MUST be in TABULAR FORM.
  → Use clear column headings.
  → No paragraph-style comparison.

IMPORTANT:
- Output ONLY the answer text.
- Do NOT add anything before or after.
"""

def get_prompt_design_guided(item, exam_answer):
    return f"""
You are generating guided study material based on an exam answer.

SUBJECT: {item['subject']}
SEMESTER: {item['semester']}
QUESTION:
{item['question']}

EXAM ANSWER (for reference):
{exam_answer}

CRITICAL:
- Every tag below MUST appear exactly once.
- Do NOT output anything outside the tags.
- If something is not applicable, write "N/A".

TASKS:
1. Explain the task at Beginner → Intermediate level.
2. Generate ONE exam follow-up question.
3. Generate THREE guided follow-up questions.
4. Extract 4–6 syllabus-level technical keywords.

----------OUTPUT FORMAT----------
<RESULT>

<EXAM_FOLLOWUP>
...
</EXAM_FOLLOWUP>

<GUIDED_MODE>
...
</GUIDED_MODE>

<GUIDED_FOLLOWUP>
1. ...
2. ...
3. ...
</GUIDED_FOLLOWUP>

<KEYWORDS>
term1, term2, term3, term4
</KEYWORDS>

</RESULT>
"""

# ---------------- MODEL CALL ----------------

def call_model(prompt, max_tokens):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": TEMPERATURE,
        "max_tokens": max_tokens
    }

    resp = requests.post(API_URL, headers=headers, json=payload, timeout=120)
    if resp.status_code != 200:
        raise RuntimeError(resp.text)

    return resp.json()["choices"][0]["message"]["content"]


# ---------------- TAG UTIL ----------------

def extract_tag(text, tag):
    m = re.search(fr"<{tag}>(.*?)</{tag}>", text, re.S)
    return m.group(1).strip() if m else None


# ---------------- EXAM PARSER (ALL FAMILIES) ----------------
# Exam pass is RAW TEXT by design

def is_valid_exam_answer(text):
    # allow short answers for programming / design
    return text and len(text.strip()) >= 15


# ---------------- GUIDED TAG PARSER (ALL FAMILIES) ----------------

def parse_guided_tagged(text):
    keywords_raw = extract_tag(text, "KEYWORDS")

    return {
        "guided_mode_answer": extract_tag(text, "GUIDED_MODE"),
        "guided_f_question": extract_tag(text, "GUIDED_FOLLOWUP"),
        "exam_f_question": extract_tag(text, "EXAM_FOLLOWUP"),
        "keywords": (
            [k.strip() for k in keywords_raw.split(",")]
            if keywords_raw else []
        )
    }


def is_valid_guided(parsed, mark):
    required = ["guided_mode_answer", "guided_f_question"]

    # exam follow-up only required for >= 4 marks
    if mark >= 4:
        required.append("exam_f_question")

    return all(parsed.get(k) and parsed[k].strip() for k in required)


# ---------------- PROMPT ROUTING ----------------

def route_exam_prompt(item):
    family = item.get("family")
    if family == "math_phys":
        return get_prompt_math_phys_exam(item)
    if family == "programming":
        return get_prompt_programming_exam(item)
    if family == "design":
        return get_prompt_design_exam(item)
    return None


def route_guided_prompt(item, exam_answer):
    family = item.get("family")
    if family == "math_phys":
        return get_prompt_math_phys_guided(item, exam_answer)
    if family == "programming":
        return get_prompt_programming_guided(item, exam_answer)
    if family == "design":
        return get_prompt_design_guided(item, exam_answer)
    return None


# ---------------- MAIN ----------------

def main():
    seeds = json.load(open(INPUT_FILE))
    failed = []

    start_idx = int(open(CHECKPOINT_FILE).read()) if os.path.exists(CHECKPOINT_FILE) else 0

    print(f"Starting dataset generation using {MODEL_NAME}")
    print(f"Resuming from index: {start_idx}")

    for i in tqdm(range(start_idx, len(seeds))):
        item = seeds[i]

        try:
            # ---------- PASS 1: EXAM ----------
            exam_prompt = route_exam_prompt(item)
            if not exam_prompt:
                raise ValueError("Unknown family")

            exam_raw = call_model(exam_prompt, MAX_TOKENS_EXAM)
            exam_answer = exam_raw.strip()

            if not is_valid_exam_answer(exam_answer):
                raise ValueError("Exam pass failed")

            # ---------- PASS 2: GUIDED ----------
            guided_prompt = route_guided_prompt(item, exam_answer)
            guided_raw = call_model(guided_prompt, MAX_TOKENS_GUIDED)
            guided = parse_guided_tagged(guided_raw)

            guided["keywords"] = guided.get("keywords") or []

            # Retry ONCE if guided fails
            if not is_valid_guided(guided, item["mark"]):
                guided_raw = call_model(guided_prompt, MAX_TOKENS_GUIDED)
                guided = parse_guided_tagged(guided_raw)
                guided["keywords"] = guided.get("keywords") or []

            if not is_valid_guided(guided, item["mark"]):
                raise ValueError("Guided pass failed")

            final = {
                "subject": item["subject"],
                "question": item["question"],
                "marks": item["mark"],
                "exam_mode_answer": exam_answer,
                "exam_f_question": guided.get("exam_f_question"),
                "guided_mode_answer": guided["guided_mode_answer"],
                "guided_f_question": guided["guided_f_question"],
                "keywords": guided["keywords"]
            }

            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(final, ensure_ascii=False) + "\n")

            with open(CHECKPOINT_FILE, "w") as ck:
                ck.write(str(i + 1))

        except Exception as e:
            failed.append({
                "index": i,
                "seed": item,
                "error": str(e)
            })

        time.sleep(REQUEST_DELAY)

    if failed:
        json.dump(failed, open(FAILED_FILE, "w"), indent=2, ensure_ascii=False)

    print("Bhayo finally!! Hurray!!!")


if __name__ == "__main__":
    main()

