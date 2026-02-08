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

INPUT_FILE = "test_merged_dataset.json"
OUTPUT_FILE = "test_expanded_dataset.jsonl"
FAILED_FILE = "test_failed_seeds.json"
CHECKPOINT_FILE = "test_checkpoint.txt"

MAX_TOKENS = 1400
TEMPERATURE = 0.2
REQUEST_DELAY = 1.5

API_KEY = os.environ.get("DEEPSEEK_API_KEY")
if not API_KEY:
    raise RuntimeError("DEEPSEEK_API_KEY not found in environment")

# ---------------- PROMPT TEMPLATES ----------------

def get_prompt_math_phys(item):
    return f"""
You are generating study material for Kathmandu University engineering students.

SUBJECT: {item['subject']}
SEMESTER: {item['semester']}
MARKS: {item['mark']}

QUESTION:
{item['question']}

----------EXAM MODE INSTRUCTIONS----------
Write the answer exactly as a KU student would write in exams.

Rules:
- Optimize strictly for {item['mark']} marks.
- No unnecessary theory.
- Clear derivations and numericals when required.
- Mention assumptions ONLY if they earn marks.
- Do NOT reference figures; describe steps instead.

For numericals / derivations, follow this flow whenever applicable:
- Here, its given that,
- We know,
- Now, by the definition of,
- Substituting,
- Similarly / Then,
- We get,
- Hence,

----------GUIDED MODE----------
Teach the same concept at Beginner → Intermediate level.

Rules:
- Explain physical or geometric intuition first.
- Then explain mathematics step by step.
- Assume the student is learning this for the first time.
- It is OK if guided mode is longer than exam mode.

----------FOLLOW-UP QUESTIONS----------
Exam follow-up:
- ONE question only.
- More complex OR next syllabus topic.

Guided follow-up:
- THREE questions:
  1. Check understanding of the core principle.
  2. Identify key variables / assumptions.
  3. Bridge intuition to mathematics.

----------OUTPUT FORMAT (STRICT TAGS)----------
<RESULT>
<SUBJECT>{item['subject']}</SUBJECT>
<QUESTION>{item['question']}</QUESTION>
<MARKS>{item['mark']}</MARKS>

<EXAM_MODE>
... exam-style answer ...
</EXAM_MODE>

<EXAM_FOLLOWUP>
... exam follow-up question ...
</EXAM_FOLLOWUP>

<GUIDED_MODE>
... guided explanation ...
</GUIDED_MODE>

<GUIDED_FOLLOWUP>
1. ...
2. ...
3. ...
</GUIDED_FOLLOWUP>

<KEYWORDS>
keyword1, keyword2, keyword3, keyword4, keyword5
</KEYWORDS>
</RESULT>

Rules:
- Do NOT output JSON.
- Do NOT escape LaTeX.
- Do NOT add text outside tags.
"""


def get_prompt_programming(item):
    return f"""
You are generating a Kathmandu University programming exam answer AND a guided tutoring answer.

Subject: {item['subject']}
Semester: {item['semester']}
Marks: {item['mark']}

Question:
{item['question']}

----------EXAM MODE INSTRUCTIONS----------

- STRICTLY optimize for {item['mark']} marks.
- Write as a KU student would in exams.
- Correctness > verbosity.
- Avoid unnecessary theory.
- Use C/C++ syntax where applicable.
- Include examples ONLY if marks justify it.

----------GUIDED MODE INSTRUCTIONS----------

- Level: Beginner → Intermediate.
- Explain the idea first, then syntax.
- Break logic into small steps.
- Avoid assuming deep prior knowledge.
- Guided mode may be longer than exam mode.

----------FOLLOW-UP QUESTIONS----------

Exam follow-up:
- Generate EXACTLY ONE question.
- More complex OR next syllabus topic.

Guided follow-up:
- Generate EXACTLY THREE questions:
  1. What problem does this concept solve?
  2. What are the main components / flow?
  3. How does it work in an actual program?

----------OUTPUT FORMAT (STRICT JSON ONLY)----------
{{
  "results": [{{
    "subject": "{item['subject']}",
    "question": "{item['question']}",
    "keywords": ["..."],
    "marks": {item['mark']},

    "exam_mode_answer": "...",

    "exam_f_question": "...",

    "guided_mode_answer": "...",

    "guided_f_question": "1. ...\\n2. ...\\n3. ..."
  }}]
}}

Rules:
- Output ONLY valid JSON.
- No markdown outside JSON.
- Keywords must align with syllabus terminology.
"""

def get_prompt_design(item):
    return f"""
You are generating a Kathmandu University exam answer AND a guided tutoring answer.

Subject: {item['subject']}
Semester: {item['semester']}
Marks: {item['mark']}
Paper Type: {item.get('paper_type', 'unknown')}
Section: {item.get('section', 'unknown')}

Question:
{item['question']}

----------EXAM MODE INSTRUCTIONS----------
- STRICTLY optimize for {item['mark']} marks.
- Write exactly as a KU student would in exams.
- Be structured and concise.
- Do NOT attempt to draw diagrams.
- Explain steps, standards, or conventions instead.

----------GUIDED MODE INSTRUCTIONS----------
- Level: Beginner → Intermediate.
- Explain the purpose first, then the procedure.
- Break explanations into clear steps.
- Avoid unnecessary technical depth.

----------FOLLOW-UP QUESTIONS----------
Exam follow-up:
- Generate EXACTLY ONE question.
- More complex OR next syllabus task.

----------Guided follow-up:----------
- Generate EXACTLY THREE questions:
  1. Why is this concept / step important?
  2. What are the main rules or conventions?
  3. How is it applied in practice or exams?

----------OUTPUT FORMAT (STRICT JSON ONLY)----------
{{
  "results": [{{
    "subject": "{item['subject']}",
    "question": "{item['question']}",
    "keywords": ["..."],
    "marks": {item['mark']},

    "exam_mode_answer": "...",

    "exam_f_question": "...",

    "guided_mode_answer": "...",

    "guided_f_question": "1. ...\\n2. ...\\n3. ..."
  }}]
}}

Rules:
- Output ONLY valid JSON object.
- Keywords must match syllabus language.
- Newlines inside strings are allowed.
- Do NOT include markdown.
- Do NOT include text outside JSON.
"""

# ---------------- PROMPT ROUTING ----------------

def route_prompt(item):
    family = item.get("family")
    if family == "math_phys":
        return get_prompt_math_phys(item), "math_phys"
    elif family == "programming":
        return get_prompt_programming(item), "json"
    elif family == "design":
        return get_prompt_design(item), "json"
    return None, None

# ---------------- MODEL CALL ----------------

def call_model(prompt):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": TEMPERATURE,
        "max_tokens": MAX_TOKENS
    }

    resp = requests.post(API_URL, headers=headers, json=payload, timeout=120)
    if resp.status_code != 200:
        raise RuntimeError(resp.text)

    return resp.json()["choices"][0]["message"]["content"]

# ---------------- MATH TAG PARSER ----------------

def parse_math_output(text):
    def extract(tag):
        m = re.search(fr"<{tag}>(.*?)</{tag}>", text, re.S)
        return m.group(1).strip() if m else None

    keywords_raw = extract("KEYWORDS")

    return {
        "subject": extract("SUBJECT"),
        "question": extract("QUESTION"),
        "marks": int(extract("MARKS")),
        "exam_mode_answer": extract("EXAM_MODE"),
        "exam_f_question": extract("EXAM_FOLLOWUP"),
        "guided_mode_answer": extract("GUIDED_MODE"),
        "guided_f_question": extract("GUIDED_FOLLOWUP"),
        # keywords optional
        "keywords": (
            [k.strip() for k in keywords_raw.split(",")]
            if keywords_raw else []
        )
    }


# ---------------- JSON PARSER (PROGRAMMING / DESIGN) ----------------

def try_parse_json(raw_text):
    try:
        return json.loads(raw_text)
    except:
        pass

    start = raw_text.find("{")
    end = raw_text.rfind("}") + 1
    if start == -1 or end <= start:
        return None

    cleaned = raw_text[start:end]
    cleaned = cleaned.replace("“", "\"").replace("”", "\"")
    cleaned = cleaned.replace(",}", "}")

    try:
        return json.loads(cleaned)
    except:
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
            prompt, mode = route_prompt(item)
            if not prompt:
                raise ValueError("Unknown family")

            output = call_model(prompt)

            if mode == "math_phys":
                parsed = parse_math_output(output)
            else:
                parsed = try_parse_json(output)

            if not parsed:
                raise ValueError("Parse failed")
                
            # write output
            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(parsed, ensure_ascii=False) + "\n")
                
            # checkpoint only on success
            with open(CHECKPOINT_FILE, "w") as ck:
                ck.write(str(i + 1))
    # save failed seeds
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
