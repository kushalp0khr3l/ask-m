# ocr_pipeline.py
from ocr import extract_text_trocr
from pdf_utils import pdf_bytes_to_images
from line_segment import segment_lines_from_image_bytes
import cv2
import io

def run_ocr(file_bytes: bytes, filename: str) -> str:
    texts = []

    if filename.lower().endswith(".pdf"):
        pages = pdf_bytes_to_images(file_bytes)

        for page_idx, page in enumerate(pages, start=1):
            buf = io.BytesIO()
            page.save(buf, format="PNG")
            page_bytes = buf.getvalue()

            lines = segment_lines_from_image_bytes(page_bytes)

            page_text = []
            for line in lines:
                _, enc = cv2.imencode(".png", line)
                line_text = extract_text_trocr(enc.tobytes())
                if line_text.strip():
                    page_text.append(line_text)

            texts.append(f"--- Page {page_idx} ---\n" + "\n".join(page_text))

    else:
        lines = segment_lines_from_image_bytes(file_bytes)
        for line in lines:
            _, enc = cv2.imencode(".png", line)
            line_text = extract_text_trocr(enc.tobytes())
            if line_text.strip():
                texts.append(line_text)

    return "\n".join(texts)
