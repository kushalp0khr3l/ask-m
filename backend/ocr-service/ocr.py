# trocr_ocr.py
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
import io

# Load once (important)
processor = TrOCRProcessor.from_pretrained(
    "microsoft/trocr-base-handwritten"
)
model = VisionEncoderDecoderModel.from_pretrained(
    "microsoft/trocr-base-handwritten"
)

# CPU only (safe)
model.to("cpu")

def extract_text_trocr(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    pixel_values = processor(
        image,
        return_tensors="pt"
    ).pixel_values

    with torch.no_grad():
        generated_ids = model.generate(
            pixel_values,
            max_length=256
        )

    text = processor.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )[0]

    return text.strip()
