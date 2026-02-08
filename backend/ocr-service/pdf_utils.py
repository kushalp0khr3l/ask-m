# pdf_utils.py
from pdf2image import convert_from_bytes
import io

def pdf_bytes_to_images(pdf_bytes: bytes, dpi=300):
    pages = convert_from_bytes(
        pdf_bytes,
        dpi=dpi
    )
    return pages  # list of PIL Images
