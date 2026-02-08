# preprocess.py
import cv2
import numpy as np

def preprocess_image(image_bytes: bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        raise ValueError("Invalid image")

    # Light denoise only
    img = cv2.GaussianBlur(img, (3, 3), 0)

    return img
