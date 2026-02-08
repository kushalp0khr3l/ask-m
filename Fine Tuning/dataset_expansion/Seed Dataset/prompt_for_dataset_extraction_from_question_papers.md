## Role
Act as a professional OCR and Data Extraction Specialist.

## Task
Analyze the provided images/PDF of question papers. Extract every individual question into a structured JSON format.

## Schema
Return a JSON array of objects. Each object must contain:
- `"subject"`: The subject name or course code (e.g., "PHYS101")
- `"question"`: The verbatim text of the question
- `"mark"`: The numerical value of the marks assigned
- `"paper_type"`: Whether the question comes from "internal" or "endsem" paper
- `"section"`: The section designation (B, C only - NO Section A)

## Extraction Rules & Constraints

### 1. Handling "OR" Options
- If a question contains an "OR" choice, treat them as TWO separate JSON objects
- Copy the same `"mark"`, `"subject"`, `"paper_type"`, and `"section"` values to both objects
- **Never** join OR questions together - always separate them

### 2. Merging Sub-parts
- If a question has sub-parts (e.g., 4a, 4b, 9a, 9b), keep them within a single `"question"` string
- **Formatting**: Preserve the exact formatting and line breaks (`\n`) found in the document
- **Labels**: Preserve sub-labels (e.g., "(a)", "(b)") but do NOT include the main question number (e.g., "4.", "9.")

### 3. Marks Assignment Logic
<!--
Change this as per your requirement. We kept this as section A contains MCQs only. For extracting MCQs refer to the other file in this directory.
-->
Assign marks based on this STRICT hierarchy:

**Primary Rule**: If a specific mark is written directly next to a question, use that exact number

**Fallback Rule**: Use these section-based default marks:
- **For Internal Papers**:
  - **Section B**: 2.5 marks per question
  - **Section C**: 5 marks per question
- **For End-Semester Papers**:
  - **Section B**: 3 marks per question
  - **Section C**: 5 marks per question

**Important**: NO Section A exists. Only Sections B and C.

**Special Cases**:
- If a section header mentions a different mark scheme (e.g., "[2Qx5=10 marks]"), apply that scheme
- Return only the number (e.g., 2.5, 3, 5) in the `"mark"` field
- For questions that are part of an OR pair, assign the same marks as their counterpart

### 4. LaTeX Formatting
- Use LaTeX (`$ ... $`) for ALL mathematical expressions
- Format variables like `$R$`, `$M$`, `$P$`, `$\theta$`
- Format scientific formulas like `$P + \rho gh + \frac{1}{2}\rho v^2 = \text{constant}$`
- Ensure proper escaping for JSON: `\\` for backslashes in LaTeX

### 5. Section Detection & Paper Type
- **Paper Type Identification**: Based on file name/content, label each question as:
  - `"paper_type": "internal"` for internal assessment papers
  - `"paper_type": "endsem"` for end-semester examination papers
- **Section Detection**:
  - Extract ONLY section labels B or C from document headers
  - **NO Section A** - if something appears as Section A, it should be treated as Section B
  - If no section is explicitly labeled but questions are numbered sequentially, use contextual analysis:
    - First few questions typically = Section B
    - Later questions typically = Section C

### 6. Question Number Removal
- Do NOT include primary question numbers (1, 2, 3, etc.) at the start of the `"question"` field
- Remove numbers that appear before the actual question text
- Keep sub-part labels (a), (b) etc. within the question text

### 7. Output Format
- Return ONLY a valid JSON array of objects
- Each object must follow the exact schema above
- Do NOT include any introductory text, markdown explanations, or concluding remarks
- Ensure proper JSON escaping for LaTeX and special characters
- All questions from both internal and end-semester papers should be in a single flat array

## Expected Output Structure

```json
[
  {
    "subject": "SUBJECT_CODE",
    "question": "Full question text here with $LaTeX$ formatting",
    "mark": 2.5,
    "paper_type": "internal",
    "section": "B"
  },
  {
    "subject": "SUBJECT_CODE", 
    "question": "Alternative OR question text",
    "mark": 2.5,
    "paper_type": "internal",
    "section": "B"
  }
]
```
## Critical Reminders
<!--
Change this as per your requirement. We kept this as section A contains MCQs only. For extracting MCQs refer to the other file in this directory.
-->
NO Section A - only B and C
Internal Papers: B=2.5 marks, C=5 marks
End-Semester Papers: B=3 marks, C=5 marks
Separate OR questions into different objects
Keep sub-parts together in single question string
Use LaTeX for all mathematical expressions
Remove question numbers but keep sub-part labels
Always return pure JSON - no additional text