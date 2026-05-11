import re

def clean_text(text):
    """
    General text cleaning for all languages.
    Removes extra whitespace, URLs, and normalizes punctuation.
    """
    if not isinstance(text, str):
        return ""
        
    # Remove URLs
    text = re.sub(r'http\S+|www\.\S+', '', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_arabic(text):
    """
    Normalize Arabic text by standardizing characters and removing diacritics (Tashkeel).
    """
    # Remove diacritics
    text = re.sub(r'[\u0617-\u061A\u064B-\u0652]', '', text)
    # Normalize Alef
    text = re.sub(r'[إأآا]', 'ا', text)
    # Normalize Yaa
    text = re.sub(r'ى', 'ي', text)
    # Normalize Taa Marbuta
    text = re.sub(r'ة', 'ه', text)
    
    return text

def preprocess_pipeline(text, language=None):
    """
    Main preprocessing pipeline.
    """
    text = clean_text(text)
    
    # If language is Arabic or Algerian Darija, apply Arabic normalization
    if language in ['ar', 'dz'] or any('\u0600' <= c <= '\u06FF' for c in text):
        text = normalize_arabic(text)
        
    return text
