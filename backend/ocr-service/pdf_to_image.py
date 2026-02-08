from pdf2image import convert_from_bytes
import numpy as np
import cv2

def pdf_bytes_to_images(pdf_bytes: bytes, dpi=300):
#Converts PDF bytes to a list of OpenCV grayscale images.
    pages = convert_from_bytes(pdf_bytes, dpi=dpi)

    images = []
    for page in pages:
        # PIL → numpy
        img = np.array(page)

        # Convert to grayscale (OpenCV format)
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        images.append(gray)

    return images
