from dataclasses import dataclass
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch

from .settings import BASE_MODEL, EXAM_LORA, GUIDED_LORA

@dataclass
class ModelBundle:
    model: torch.nn.Module
    tokenizer: any

def load_bundle() -> ModelBundle:
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    # Gemma: safe padding for generation
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        device_map="auto",
        trust_remote_code=True,
    )

    # Attach EXAM adapter first
    model = PeftModel.from_pretrained(model, EXAM_LORA, adapter_name="exam")

    # Load GUIDED adapter
    model.load_adapter(GUIDED_LORA, adapter_name="guided")

    model.eval()
    return ModelBundle(model=model, tokenizer=tokenizer)
