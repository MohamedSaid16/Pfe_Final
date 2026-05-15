"""
Dataset validation module for quality assurance.
Handles deduplication, balance verification, encoding validation, etc.
"""

import pandas as pd
from collections import Counter
from typing import Dict, List, Tuple, Set
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatasetValidator:
    """Validate dataset quality and consistency."""

    def __init__(self):
        """Initialize validator."""
        self.duplicates_removed = 0
        self.encoding_issues = []

    # ========================================================================
    # DEDUPLICATION
    # ========================================================================

    def remove_duplicates(self, df: pd.DataFrame,
                          case_sensitive: bool = False) -> pd.DataFrame:
        """
        Remove duplicate entries from dataset.

        Args:
            df: Input DataFrame
            case_sensitive: Whether comparison is case-sensitive

        Returns:
            DataFrame with duplicates removed
        """
        initial_count = len(df)

        if not case_sensitive:
            # Normalize text for comparison
            df_normalized = df.copy()
            df_normalized['text_normalized'] = df_normalized['text'].str.lower(
            ).str.strip()
            df = df[~df_normalized['text_normalized'].duplicated(keep='first')]
            df = df.drop(columns=['text_normalized'], errors='ignore')
        else:
            df = df[~df['text'].str.strip().duplicated(keep='first')]

        self.duplicates_removed = initial_count - len(df)
        logger.info(f"Removed {self.duplicates_removed} duplicates")

        return df.reset_index(drop=True)

    def find_near_duplicates(self, df: pd.DataFrame,
                             similarity_threshold: float = 0.95) -> List[Tuple[int, int]]:
        """
        Find near-duplicate entries (very similar texts).

        Args:
            df: Input DataFrame
            similarity_threshold: Similarity score threshold (0-1)

        Returns:
            List of (index1, index2) pairs of near-duplicates
        """
        from difflib import SequenceMatcher

        near_dupes = []
        texts = df['text'].tolist()

        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                ratio = SequenceMatcher(None, texts[i].lower(),
                                        texts[j].lower()).ratio()
                if ratio >= similarity_threshold:
                    near_dupes.append((i, j, ratio))

        logger.info(
            f"Found {len(near_dupes)} near-duplicates above {similarity_threshold}")
        return near_dupes

    # ========================================================================
    # BALANCE VERIFICATION
    # ========================================================================

    def check_label_balance(self, df: pd.DataFrame) -> Dict[str, any]:
        """
        Verify label distribution balance.

        Args:
            df: Input DataFrame with 'label' column

        Returns:
            Dictionary with balance statistics
        """
        label_counts = df['label'].value_counts().to_dict()
        total = len(df)

        balance = {
            'counts': label_counts,
            'percentages': {k: (v/total)*100 for k, v in label_counts.items()},
            'total': total,
            'is_balanced': self._is_balanced(label_counts),
            'balance_ratio': max(label_counts.values()) / min(label_counts.values())
        }

        logger.info(f"Label distribution: {balance['counts']}")
        logger.info(f"Balance percentages: {balance['percentages']}")
        logger.info(f"Balance ratio: {balance['balance_ratio']:.2f}")

        return balance

    def check_category_balance(self, df: pd.DataFrame) -> Dict[str, any]:
        """Check balance across categories."""
        if 'category' not in df.columns:
            logger.warning("'category' column not found")
            return {}

        category_counts = df['category'].value_counts().to_dict()
        total = len(df)

        balance = {
            'counts': category_counts,
            'percentages': {k: (v/total)*100 for k, v in category_counts.items()},
            'total': total
        }

        logger.info(f"Category distribution: {balance['counts']}")
        return balance

    def check_language_balance(self, df: pd.DataFrame) -> Dict[str, any]:
        """Check balance across languages."""
        if 'language' not in df.columns:
            logger.warning("'language' column not found")
            return {}

        lang_counts = df['language'].value_counts().to_dict()
        total = len(df)

        balance = {
            'counts': lang_counts,
            'percentages': {k: (v/total)*100 for k, v in lang_counts.items()},
            'total': total,
            'is_balanced': self._is_balanced(lang_counts)
        }

        logger.info(f"Language distribution: {balance['counts']}")
        return balance

    @staticmethod
    def _is_balanced(distribution: Dict, threshold: float = 0.2) -> bool:
        """Check if distribution is relatively balanced."""
        if not distribution:
            return False

        values = list(distribution.values())
        max_val = max(values)
        min_val = min(values)

        if min_val == 0:
            return False

        # Consider balanced if ratio between min and max is less than threshold
        ratio = (max_val - min_val) / min_val
        return ratio <= threshold

    # ========================================================================
    # ENCODING VALIDATION
    # ========================================================================

    def validate_encoding(self, df: pd.DataFrame,
                          text_column: str = 'text') -> Dict[str, any]:
        """
        Validate text encoding (UTF-8, special characters, etc.).

        Args:
            df: Input DataFrame
            text_column: Name of text column

        Returns:
            Dictionary with encoding validation results
        """
        issues = []

        for idx, text in df[text_column].items():
            try:
                if isinstance(text, str):
                    # Try to encode/decode
                    text.encode('utf-8').decode('utf-8')
            except UnicodeDecodeError as e:
                issues.append(
                    {'index': idx, 'text': text[:50], 'error': str(e)})
            except Exception as e:
                issues.append(
                    {'index': idx, 'text': str(text)[:50], 'error': str(e)})

        self.encoding_issues = issues
        logger.info(f"Encoding validation: {len(issues)} issues found")

        return {
            'total_rows': len(df),
            'issues_count': len(issues),
            'issues': issues[:10],  # Show first 10
            'is_valid': len(issues) == 0
        }

    def detect_special_characters(self, df: pd.DataFrame,
                                  text_column: str = 'text') -> Dict[str, List[str]]:
        """
        Detect special characters and scripts used.

        Args:
            df: Input DataFrame
            text_column: Name of text column

        Returns:
            Dictionary mapping character types to examples
        """
        special_chars = {
            'arabic': set(),
            'emoji': set(),
            'punctuation': set(),
            'numbers': set(),
            'latin': set(),
        }

        for text in df[text_column]:
            if not isinstance(text, str):
                continue

            for char in text:
                # Arabic Unicode ranges
                if '\u0600' <= char <= '\u06FF':
                    special_chars['arabic'].add(char)
                # Emoji ranges
                elif ord(char) > 127 and char not in 'àâäéèêëïîôöùûüœæ':
                    special_chars['emoji'].add(char)
                elif not char.isalnum() and char != ' ':
                    special_chars['punctuation'].add(char)
                elif char.isdigit():
                    special_chars['numbers'].add(char)
                elif char.isalpha() and ord(char) < 128:
                    special_chars['latin'].add(char)

        result = {k: sorted(list(v))[:20] for k, v in special_chars.items()}
        logger.info(f"Detected character types: {result}")

        return result

    # ========================================================================
    # CONSISTENCY CHECKS
    # ========================================================================

    def validate_columns(self, df: pd.DataFrame,
                         required_columns: List[str]) -> Dict[str, any]:
        """
        Validate required columns exist.

        Args:
            df: Input DataFrame
            required_columns: List of required column names

        Returns:
            Validation result
        """
        missing = [col for col in required_columns if col not in df.columns]

        result = {
            'valid': len(missing) == 0,
            'required_columns': required_columns,
            'found_columns': list(df.columns),
            'missing_columns': missing
        }

        if missing:
            logger.warning(f"Missing columns: {missing}")
        else:
            logger.info("All required columns present")

        return result

    def check_missing_values(self, df: pd.DataFrame) -> Dict[str, any]:
        """Check for missing/null values."""
        missing = df.isnull().sum().to_dict()

        result = {
            'total_rows': len(df),
            'missing_per_column': missing,
            'has_missing': any(count > 0 for count in missing.values())
        }

        if result['has_missing']:
            logger.warning(f"Missing values detected: {missing}")
        else:
            logger.info("No missing values detected")

        return result

    def validate_label_values(self, df: pd.DataFrame,
                              valid_labels: List[int]) -> Dict[str, any]:
        """
        Validate label column contains only valid values.

        Args:
            df: Input DataFrame
            valid_labels: List of valid label values

        Returns:
            Validation result
        """
        invalid_labels = df[~df['label'].isin(
            valid_labels)]['label'].unique().tolist()

        result = {
            'valid': len(invalid_labels) == 0,
            'valid_labels': valid_labels,
            'found_labels': sorted(df['label'].unique().tolist()),
            'invalid_labels': invalid_labels,
            'invalid_count': len(df[~df['label'].isin(valid_labels)])
        }

        if invalid_labels:
            logger.warning(f"Invalid label values: {invalid_labels}")
        else:
            logger.info("All label values are valid")

        return result

    # ========================================================================
    # COMPREHENSIVE VALIDATION
    # ========================================================================

    def full_validation_report(self, df: pd.DataFrame) -> Dict[str, any]:
        """
        Generate comprehensive validation report.

        Args:
            df: Input DataFrame to validate

        Returns:
            Complete validation report
        """
        logger.info("Starting full dataset validation...")

        report = {
            'dataset_size': len(df),
            'columns': {
                'validation': self.validate_columns(
                    df, ['text', 'label', 'language', 'category']
                ),
                'missing_values': self.check_missing_values(df),
                'label_validation': self.validate_label_values(df, [0, 1]),
            },
            'balance': {
                'labels': self.check_label_balance(df),
                'categories': self.check_category_balance(df),
                'languages': self.check_language_balance(df),
            },
            'encoding': {
                'utf8_validation': self.validate_encoding(df),
                'character_analysis': self.detect_special_characters(df),
            },
            'duplicates': {
                'removed_count': self.duplicates_removed,
            },
            'summary': {
                'is_valid': True,  # Set based on other checks
            }
        }

        # Determine overall validity
        is_valid = (
            report['columns']['validation']['valid'] and
            not report['columns']['missing_values']['has_missing'] and
            report['columns']['label_validation']['valid'] and
            report['encoding']['utf8_validation']['is_valid']
        )

        report['summary']['is_valid'] = is_valid
        logger.info(f"Validation complete. Dataset valid: {is_valid}")

        return report

    def print_report(self, report: Dict[str, any]) -> None:
        """Pretty-print validation report."""
        print("\n" + "="*80)
        print("DATASET VALIDATION REPORT")
        print("="*80)
        print(f"\nDataset Size: {report['dataset_size']} rows")
        print(f"Overall Valid: {report['summary']['is_valid']}")

        print("\nBalance Statistics:")
        labels = report['balance']['labels']
        print(f"  Labels: {labels['counts']}")
        print(f"  Balance Ratio: {labels['balance_ratio']:.2f}:1")

        langs = report['balance']['languages']
        print(f"  Languages: {langs['counts']}")

        print("\nEncoding Validation:")
        enc = report['encoding']['utf8_validation']
        print(f"  UTF-8 Valid: {enc['is_valid']}")
        print(f"  Issues: {enc['issues_count']}")

        print("\n" + "="*80 + "\n")


def create_validator() -> DatasetValidator:
    """Factory function to create validator."""
    return DatasetValidator()
