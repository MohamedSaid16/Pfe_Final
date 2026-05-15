import easyocr
import os
import ssl

# Fix for macOS Python SSL Certificate Error when downloading models
ssl._create_default_https_context = ssl._create_unverified_context

# Initialize reader globally so it's only loaded once (takes time and memory)
# Using CPU by default as requested.
# Supporting English, French, and Arabic.
print("Initializing EasyOCR Model (this might take a moment)...")
reader = easyocr.Reader(['ar', 'en'], gpu=False)

def extract_text_from_image(image_path):
    """
    Extracts text from an image file using EasyOCR.
    """
    try:
        # readtext returns a list of tuples: (bbox, text, prob)
        result = reader.readtext(image_path, detail=0)
        text = " ".join(result)
        return text.strip()
    except Exception as e:
        print(f"Error during OCR: {e}")
        return ""
