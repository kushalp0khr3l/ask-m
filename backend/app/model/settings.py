BASE_MODEL = "unsloth/gemma-3-12b-it-bnb-4bit"
EXAM_LORA  = "walterwhite91/ask-m-gemma3-exam-lora"
GUIDED_LORA= "walterwhite91/ask-m-gemma3-guide-lora"

# Generation defaults
DEFAULT_MAX_NEW_TOKENS = 256
DEFAULT_TEMPERATURE = 0.2
DEFAULT_TOP_P = 0.95
DEFAULT_DO_SAMPLE = False  # deterministic by default
