"""
Dataset augmentation module for creating realistic variations.
Handles OCR noise, emoji injection, capitalization, punctuation, etc.
"""

import random
from typing import List, Tuple

from vocabulary import AUGMENTATION_PATTERNS, CONTEXT_TEMPLATES, CONTEXT_SENTENCES


class DataAugmentor:
    """Augment text samples with realistic variations."""

    def __init__(self, seed: int = 42):
        """Initialize augmentor."""
        random.seed(seed)

    # ========================================================================
    # OCR NOISE GENERATION
    # ========================================================================

    def inject_ocr_noise(self, text: str, noise_level: float = 0.1) -> str:
        """
        Inject OCR-like corruption into text.
        Simulates character recognition errors from scanned documents.

        Args:
            text: Input text
            noise_level: Percentage of characters to corrupt (0.0-1.0)

        Returns:
            Text with OCR noise injected
        """
        if random.random() > 0.7:  # 30% chance to apply
            text = list(text)
            num_chars = int(len(text) * noise_level)
            positions = random.sample(
                range(len(text)), min(num_chars, len(text)))

            ocr_replacements = {
                'l': '1', '1': 'l', 'I': '1', '0': 'O', 'O': '0',
                'S': '5', '5': 'S', 'i': '1', 'o': '0', 's': '5',
                'B': '8', '8': 'B', 'b': '6', 'g': '9', 'q': '9',
            }

            for pos in positions:
                char = text[pos]
                if char in ocr_replacements:
                    text[pos] = ocr_replacements[char]

            return ''.join(text)
        return text

    def inject_multiple_ocr_variants(self, text: str, count: int = 3) -> List[str]:
        """Generate multiple OCR-corrupted variants."""
        return [self.inject_ocr_noise(text, random.uniform(0.05, 0.15))
                for _ in range(count)]

    # ========================================================================
    # CAPITALIZATION VARIATIONS
    # ========================================================================

    def capitalize_random(self, text: str) -> str:
        """Random capitalization pattern."""
        if random.random() > 0.5:
            text = list(text)
            for i in range(len(text)):
                if text[i].isalpha():
                    if random.random() > 0.5:
                        text[i] = text[i].upper()
            return ''.join(text)
        return text

    def capitalize_all(self, text: str) -> str:
        """ALL CAPS variant."""
        return text.upper()

    def capitalize_first_only(self, text: str) -> str:
        """Capitalize first letter only."""
        if len(text) > 0:
            return text[0].upper() + text[1:].lower()
        return text

    # ========================================================================
    # PUNCTUATION AUGMENTATION
    # ========================================================================

    def inject_punctuation_noise(self, text: str, intensity: str = "medium") -> str:
        """
        Add punctuation noise to text.

        Args:
            text: Input text
            intensity: "light", "medium", "heavy"
        """
        if random.random() > 0.6:  # 40% chance
            punct_counts = {"light": 1, "medium": 2, "heavy": 3}
            count = punct_counts.get(intensity, 2)

            punctuations = ["!", "?", ".", ",", "~", "*", ":", ";"]

            for _ in range(count):
                if random.random() > 0.5 and len(text) > 0:
                    pos = random.randint(0, len(text))
                    punct = random.choice(punctuations)
                    text = text[:pos] + punct + text[pos:]

        # Add repeated punctuation at end
        if random.random() > 0.5:
            text += random.choice(["!", "?", "!!!", "???"]
                                  ) * random.randint(1, 3)

        return text

    # ========================================================================
    # CHARACTER REPETITION
    # ========================================================================

    def repeat_characters(self, text: str, intensity: float = 0.3) -> str:
        """
        Repeat characters for emphasis (stuuuupid, fuuuuck, etc.).

        Args:
            text: Input text
            intensity: Percentage of eligible characters to repeat
        """
        if random.random() > 0.6:  # 40% chance
            words = text.split()
            new_words = []

            for word in words:
                if len(word) > 2 and random.random() < intensity:
                    # Find repeated-able characters (vowels, consonants)
                    positions = [i for i, c in enumerate(word)
                                 if c.lower() in 'aeiououy']
                    if positions:
                        pos = random.choice(positions)
                        repeats = random.randint(2, 4)
                        word = word[:pos] + word[pos] * repeats + word[pos+1:]

                new_words.append(word)

            return ' '.join(new_words)
        return text

    # ========================================================================
    # EMOJI INJECTION
    # ========================================================================

    def inject_emoji(self, text: str, is_toxic: bool = True) -> str:
        """
        Add emojis to text for realism.

        Args:
            text: Input text
            is_toxic: Use toxic or safe emojis
        """
        if random.random() > 0.7:  # 30% chance
            emojis = (AUGMENTATION_PATTERNS["emoji_toxic"] if is_toxic
                      else AUGMENTATION_PATTERNS["emoji_safe"])

            emoji_count = random.randint(1, 2)
            for _ in range(emoji_count):
                emoji = random.choice(emojis)
                if random.random() > 0.5:
                    text = emoji + " " + text
                else:
                    text = text + " " + emoji

        return text

    # ========================================================================
    # LANGUAGE MIXING
    # ========================================================================

    def mix_language(self, text: str, primary_lang: str,
                     secondary_langs: List[str] = None) -> str:
        """
        Mix text with other languages (code-switching).

        Args:
            text: Input text
            primary_lang: Primary language code
            secondary_langs: List of language codes to mix in
        """
        if random.random() > 0.75:  # 25% chance
            secondary_langs = secondary_langs or ["en", "fr", "ar", "dz"]
            secondary_langs = [l for l in secondary_langs if l != primary_lang]

            if secondary_langs and random.random() > 0.5:
                lang = random.choice(secondary_langs)
                context_words = CONTEXT_SENTENCES.get(lang, [])

                if context_words:
                    word = random.choice(context_words)
                    if random.random() > 0.5:
                        text = word + " " + text
                    else:
                        text = text + " " + word

        return text

    # ========================================================================
    # DARIJA SPECIFIC AUGMENTATION
    # ========================================================================

    def darija_spelling_variants(self, text: str) -> List[str]:
        """
        Generate Darija spelling variants.
        Darija can be written in Latin script and Arabic script.
        """
        variants = [text]

        # Common Darija spelling variations
        replacements = {
            "nk": "n9", "kh": "kh", "gh": "g", "dj": "j",
            "ch": "sh", "th": "t", "dh": "d", "zh": "j",
        }

        if random.random() > 0.5:
            variant = text
            for old, new in replacements.items():
                if old in variant.lower():
                    variant = variant.replace(old, new)
            variants.append(variant)

        return variants

    # ========================================================================
    # ARABIC NORMALIZATION
    # ========================================================================

    def arabic_normalization_variants(self, text: str) -> List[str]:
        """
        Generate Arabic text normalization variants.
        Different Arabic diacritics and letter forms.
        """
        variants = [text]

        # Common Arabic normalization
        arabic_replacements = {
            "أ": "ا", "إ": "ا", "آ": "ا",  # Alef variants
            "ة": "ه",  # Teh marbuta to Heh
            "ى": "ي",  # Alef maksura to Yeh
        }

        if random.random() > 0.6:
            variant = text
            for old, new in arabic_replacements.items():
                variant = variant.replace(old, new)
            variants.append(variant)

        return variants

    # ========================================================================
    # COMPREHENSIVE AUGMENTATION
    # ========================================================================

    def augment_comprehensive(self, text: str, language: str,
                              is_toxic: bool = True,
                              augmentation_count: int = 5) -> List[str]:
        """
        Generate multiple augmented variants of text.

        Args:
            text: Input text
            language: Language code (en, fr, ar, dz)
            is_toxic: Whether text is toxic
            augmentation_count: Number of variants to generate

        Returns:
            List of augmented text variants
        """
        augmented = [text]  # Original

        for _ in range(augmentation_count):
            variant = text

            # Apply random augmentations
            if random.random() > 0.5:
                variant = self.capitalize_random(variant)

            if random.random() > 0.5:
                variant = self.repeat_characters(variant)

            if random.random() > 0.6:
                variant = self.inject_punctuation_noise(variant)

            if random.random() > 0.7:
                variant = self.inject_ocr_noise(variant)

            if random.random() > 0.7:
                variant = self.inject_emoji(variant, is_toxic)

            if random.random() > 0.8:
                variant = self.mix_language(variant, language)

            if language == "dz" and random.random() > 0.7:
                variants = self.darija_spelling_variants(variant)
                if variants:
                    variant = variants[0]

            if language == "ar" and random.random() > 0.7:
                variants = self.arabic_normalization_variants(variant)
                if variants:
                    variant = variants[0]

            if variant and variant != text:
                augmented.append(variant)

        return augmented[:augmentation_count + 1]

    def batch_augment(self, texts: List[str], language: str,
                      is_toxic: bool = True) -> List[str]:
        """
        Augment a batch of texts.

        Args:
            texts: List of texts
            language: Language code
            is_toxic: Whether texts are toxic

        Returns:
            Augmented texts
        """
        augmented = []
        for text in texts:
            variants = self.augment_comprehensive(
                text, language, is_toxic, augmentation_count=2
            )
            augmented.extend(variants)

        return augmented


def create_augmentor(seed: int = 42) -> DataAugmentor:
    """Factory function to create augmentor."""
    return DataAugmentor(seed=seed)
