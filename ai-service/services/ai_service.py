import os
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from langdetect import detect
from ai.preprocessing import preprocess_pipeline

class ToxicityClassifier:
    def __init__(self): # User requested CPU for normal hardware
        self.device = torch.device("cpu")
        self.model_dir = os.path.join(os.path.dirname(
            os.path.dirname(os.path.dirname(__file__))), "trained_model")

        # Check if user has trained the custom model
        if os.path.exists(self.model_dir) and os.path.exists(os.path.join(self.model_dir, "config.json")):
            print("Loading custom trained model...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.model_dir)
            self.is_custom = True
        else:
            # Fallback to a lightweight pre-trained multilingual offensive model to ensure the app works immediately
            print(
                "Custom model not found. Loading fallback pre-trained multilingual model...")
            fallback_model = "unitary/multilingual-toxic-xlm-roberta"
            self.tokenizer = AutoTokenizer.from_pretrained(
                fallback_model,
                use_fast=False
            )
            self.model = AutoModelForSequenceClassification.from_pretrained(
                fallback_model)
            self.is_custom = False

        self.model.to(self.device)
        self.model.eval()

        # A comprehensive dictionary for highlighting and safety net overrides
        self.toxic_lexicon = [
            # English
            'stupid', 'idiot', 'hate', 'kill', 'fuck', 'shit', 'ass', 'asshole', 'pussy', 'dick', 'bitch', 'cunt', 'bastard', 'whore', 'slut', 'fag', 'moron', 'retard', 'scum',
            # French
            'con', 'merde', 'putain', 'salope', 'connard', 'connasse', 'pute', 'pd', 'enculé', 'bâtard', 'nique', 'niquer', 'gueule',
            # Arabic
            'حمار', 'غبي', 'كلب', 'نيك', 'قحبة', 'زامل', 'شرموطة', 'كلبة', 'مخنث', 'زب', 'طيز',
            # Darija / Slang
            'hmar', 'kavi', 'rkhas', 't9awed', 'zbi', 'nik', 'kahba', 'zamel', 'kelb', 'atay'
        ]

    def detect_language(self, text):
        try:
            return detect(text)
        except:
            return "unknown"

    def analyze(self, raw_text):
        if not raw_text.strip():
            return self._empty_result()

        # Detect Language
        lang = self.detect_language(raw_text)

        # Preprocess
        text = preprocess_pipeline(raw_text, language=lang)

        # Handle long texts (like PDFs) to prevent Out-Of-Distribution hallucinations
        words = text.split()
        chunk_size = 40
        chunks = [" ".join(words[i:i+chunk_size])
                  for i in range(0, len(words), chunk_size)]

        # Evaluate up to 5 chunks to keep CPU inference fast
        if len(chunks) > 5:
            chunks = chunks[:3] + chunks[-2:]

        max_toxic_prob = 0.0
        max_confidence = 0.0

        for chunk in chunks:
            inputs = self.tokenizer(
                chunk, return_tensors="pt", truncation=True, max_length=128, padding=True).to(self.device)
            with torch.no_grad():
                outputs = self.model(**inputs)

                logits = outputs.logits
                probs = torch.sigmoid(logits)[0]

                # Take highest toxicity score

                prob = torch.max(probs).item()
                max_toxic_prob = max(max_toxic_prob, prob)
                max_confidence = max(max_confidence, max(probs.tolist()))

        # Stricter threshold to avoid false positives
        threshold = 0.75
        is_toxic = bool(max_toxic_prob > threshold)

        # Find all toxic words present
        detected_words = []
        text_lower = text.lower()
        for w in self.toxic_lexicon:
            if w in text_lower.split() or f" {w} " in f" {text_lower} ":
                detected_words.append(w)

        # Stricter threshold to avoid false positives
        threshold = 0.75
        is_toxic = bool(max_toxic_prob > threshold)

        # FOOLPROOF Safety Net (Out-of-distribution hallucinations & Lexicon Overrides)
        if len(detected_words) > 0:
            # Lexicon Promotion: If a known highly offensive word is present, it is definitely toxic.
            # Override the AI if it missed it (due to limited training data).
            is_toxic = True
            max_toxic_prob = max(max_toxic_prob, 0.95)
            max_confidence = max(max_confidence, 0.99)
        elif is_toxic and len(detected_words) == 0:
            # Lexicon Demotion: If the AI hallucinates toxicity on formal/OCR text with NO known bad words.
            is_toxic = False
            max_toxic_prob = 0.1
            max_confidence = 0.99

        # Highlight toxic words
        highlighted = self._highlight_text(text, detected_words)

        # Predict Category
        category = self._guess_category(text, is_toxic)

        return {
            'text': raw_text[:1000] + ("..." if len(raw_text) > 1000 else ""),
            'language': lang,
            'is_toxic': is_toxic,
            'toxicity_score': max_toxic_prob,
            'confidence': max_confidence,
            'category': category,
            'highlighted_html': highlighted,
            'detected_words': detected_words
        }

    def _highlight_text(self, text, detected_words):
        """
        Highlights the explicitly detected words in the text.
        """
        if not detected_words:
            return text

        words = text.split()
        highlighted_words = []

        for w in words:
            clean_w = ''.join(c for c in w if c.isalnum()).lower()
            if clean_w in detected_words:
                highlighted_words.append(
                    f'<span class="bg-red-500/30 text-red-300 font-bold px-1 rounded border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]">{w}</span>')
            else:
                highlighted_words.append(w)

        return " ".join(highlighted_words)

    def _guess_category(self, text, is_toxic):
        if not is_toxic:
            return "none"
        text_lower = text.lower()
        if any(w in text_lower for w in ['kill', 'تقتل', 'n9etlek', 'tuer']):
            return "threat"
        if any(w in text_lower for w in ['hate', 'أكره', 'nكره', 'déteste']):
            return "hate speech"
        return "offensive/insult"

    def _empty_result(self):
        return {
            'text': "",
            'language': "unknown",
            'is_toxic': False,
            'toxicity_score': 0.0,
            'confidence': 0.0,
            'category': "none",
            'highlighted_html': ""
        }

ai_classifier = ToxicityClassifier()


def analyze_text(text: str):
    """
    Main function used by FastAPI app
    """
    return ai_classifier.analyze(text)
