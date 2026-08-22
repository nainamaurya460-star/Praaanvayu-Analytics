import cv2
import numpy as np

def analyze_canopy_image(image_bytes: bytes) -> dict:
    """
    Decodes raw image bytes and uses HSV vegetation masking
    to compute exact green canopy coverage percentage.
    """
    # Convert raw bytes to numpy image array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid or corrupted image format.")

    # Convert BGR color space to HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Threshold for healthy green vegetation in HSV space
    lower_green = np.array([25, 40, 40])
    upper_green = np.array([85, 255, 255])

    # Binary mask: 255 for vegetation, 0 for urban/barren land
    green_mask = cv2.inRange(hsv, lower_green, upper_green)

    total_pixels = int(img.shape[0] * img.shape[1])
    green_pixels = int(cv2.countNonZero(green_mask))

    canopy_percent = round((green_pixels / total_pixels) * 100.0, 2)

    return {
        "total_pixels": total_pixels,
        "green_pixels": green_pixels,
        "canopy_coverage_percent": canopy_percent,
        "is_severely_deficient": bool(canopy_percent < 33.0)
    }