import torch
from .settings import (
    DEFAULT_MAX_NEW_TOKENS,
    DEFAULT_TEMPERATURE,
    DEFAULT_TOP_P,
    DEFAULT_DO_SAMPLE,
)

def _format_prompt(question: str) -> str:
    return question.strip()

@torch.inference_mode()
def generate(
    model,
    tokenizer,
    question: str,
    mode: str = "exam",  # "exam" or "guided"
    max_new_tokens: int = DEFAULT_MAX_NEW_TOKENS,
    temperature: float = DEFAULT_TEMPERATURE,
    top_p: float = DEFAULT_TOP_P,
    do_sample: bool = DEFAULT_DO_SAMPLE,
) -> str:
    if mode not in {"exam", "guided"}:
        raise ValueError("mode must be 'exam' or 'guided'")

    # Switch adapter
    model.set_adapter(mode)

    prompt = _format_prompt(question)
    inputs = tokenizer(prompt, return_tensors="pt", padding=True)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    out = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        do_sample=do_sample,
        temperature=temperature if do_sample else None,
        top_p=top_p if do_sample else None,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
    )

    text = tokenizer.decode(out[0], skip_special_tokens=True).strip()
    return text
