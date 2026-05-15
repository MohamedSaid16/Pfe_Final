"""
Main dataset generation pipeline for multilingual toxic content detection.
Generates complete datasets for English, French, Arabic, and Algerian Darija.

Usage:
    python generate_dataset.py
"""

import pandas as pd
import random
from pathlib import Path
from typing import List, Dict, Tuple
import logging
from collections import defaultdict

from vocabulary import (
    get_vocabulary, get_language_names, get_toxic_categories,
    get_safe_categories
)
from augment_dataset import create_augmentor
from validate_dataset import create_validator
from split_dataset import create_splitter

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatasetGenerator:
    """Generate comprehensive multilingual toxic content dataset."""

    def __init__(self, seed: int = 42, augment_count: int = 2):
        """
        Initialize dataset generator.

        Args:
            seed: Random seed for reproducibility
            augment_count: Number of augmentations per phrase
        """
        random.seed(seed)
        self.seed = seed
        self.augment_count = augment_count
        self.augmentor = create_augmentor(seed=seed)
        self.validator = create_validator()
        self.splitter = create_splitter(random_state=seed)

        self.vocabulary = get_vocabulary()
        self.language_names = get_language_names()
        self.toxic_categories = get_toxic_categories()
        self.safe_categories = get_safe_categories()

        self.dataset = []

    # ========================================================================
    # DATASET GENERATION
    # ========================================================================

    def generate_language_dataset(self, language: str,
                                  min_per_category: int = 500) -> List[Dict]:
        """
        Generate dataset for a specific language.

        Args:
            language: Language code (en, fr, ar, dz)
            min_per_category: Minimum examples per category

        Returns:
            List of data dictionaries
        """
        logger.info(
            f"Generating dataset for {self.language_names[language]}...")

        data = []

        # Toxic data generation
        toxic_vocab = self.vocabulary[language]['toxic']

        for category in self.toxic_categories:
            if category not in toxic_vocab:
                logger.warning(
                    f"Category '{category}' not found for {language}")
                continue

            phrases = toxic_vocab[category]

            # Generate minimum required examples
            for phrase in phrases[:min_per_category]:
                # Original phrase
                data.append({
                    'text': phrase,
                    'label': 1,
                    'language': language,
                    'category': category
                })

                # Augmented variants
                if self.augment_count > 0:
                    augmented = self.augmentor.augment_comprehensive(
                        phrase, language, is_toxic=True,
                        augmentation_count=self.augment_count
                    )

                    for variant in augmented[1:]:  # Skip original
                        data.append({
                            'text': variant,
                            'label': 1,
                            'language': language,
                            'category': category
                        })

        # Safe data generation
        safe_vocab = self.vocabulary[language]['safe']
        total_toxic = len(data)

        logger.info(f"Generated {total_toxic} toxic examples")

        for category in self.safe_categories:
            if category not in safe_vocab:
                logger.warning(
                    f"Safe category '{category}' not found for {language}")
                continue

            phrases = safe_vocab[category]

            # Generate similar amount of safe examples
            examples_needed = len(phrases)

            for phrase in phrases[:examples_needed]:
                # Original phrase
                data.append({
                    'text': phrase,
                    'label': 0,
                    'language': language,
                    'category': category
                })

                # Augmented variants
                if self.augment_count > 0:
                    augmented = self.augmentor.augment_comprehensive(
                        phrase, language, is_toxic=False,
                        augmentation_count=self.augment_count
                    )

                    for variant in augmented[1:]:  # Skip original
                        data.append({
                            'text': variant,
                            'label': 0,
                            'language': language,
                            'category': category
                        })

        total_safe = len(data) - total_toxic
        logger.info(f"Generated {total_safe} safe examples for {language}")
        logger.info(f"Total for {language}: {len(data)} examples")

        return data

    def generate_complete_dataset(self) -> pd.DataFrame:
        """
        Generate complete multilingual dataset.

        Returns:
            DataFrame with all data
        """
        logger.info("Starting complete dataset generation...")

        all_data = []

        for language in ['en', 'fr', 'ar', 'dz']:
            lang_data = self.generate_language_dataset(
                language, min_per_category=500)
            all_data.extend(lang_data)

        df = pd.DataFrame(all_data)

        logger.info(f"Generated complete dataset with {len(df)} rows")
        logger.info(f"\nDataset Summary:")
        logger.info(f"  Total rows: {len(df)}")
        logger.info(f"  Toxic: {len(df[df['label'] == 1])}")
        logger.info(f"  Safe: {len(df[df['label'] == 0])}")
        logger.info(f"  Languages: {df['language'].unique().tolist()}")

        return df

    # ========================================================================
    # DATA PROCESSING
    # ========================================================================

    def shuffle_and_deduplicate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Shuffle dataset and remove duplicates.

        Args:
            df: Input DataFrame

        Returns:
            Processed DataFrame
        """
        logger.info("Shuffling and deduplicating dataset...")

        # Shuffle
        df = df.sample(frac=1, random_state=self.seed).reset_index(drop=True)

        # Remove duplicates
        initial_count = len(df)
        df = self.validator.remove_duplicates(df, case_sensitive=False)
        final_count = len(df)

        logger.info(f"Removed {initial_count - final_count} duplicates")

        return df

    def balance_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Balance toxic vs safe examples.

        Args:
            df: Input DataFrame

        Returns:
            Balanced DataFrame
        """
        logger.info("Balancing dataset...")

        toxic_count = len(df[df['label'] == 1])
        safe_count = len(df[df['label'] == 0])

        target_count = min(toxic_count, safe_count)

        toxic_df = df[df['label'] == 1].sample(
            n=target_count, random_state=self.seed)
        safe_df = df[df['label'] == 0].sample(
            n=target_count, random_state=self.seed)

        df_balanced = pd.concat([toxic_df, safe_df], ignore_index=True)
        df_balanced = df_balanced.sample(
            frac=1, random_state=self.seed).reset_index(drop=True)

        logger.info(
            f"Balanced dataset to {len(df_balanced)} rows ({target_count} per class)")

        return df_balanced

    # ========================================================================
    # EXPORT FUNCTIONS
    # ========================================================================

    def save_splits(self, train_df: pd.DataFrame, val_df: pd.DataFrame,
                    test_df: pd.DataFrame, output_dir: Path) -> None:
        """
        Save train/val/test splits to CSV files.

        Args:
            train_df, val_df, test_df: Split DataFrames
            output_dir: Output directory path
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        train_path = output_dir / 'train.csv'
        val_path = output_dir / 'val.csv'
        test_path = output_dir / 'test.csv'

        train_df.to_csv(train_path, index=False, encoding='utf-8')
        val_df.to_csv(val_path, index=False, encoding='utf-8')
        test_df.to_csv(test_path, index=False, encoding='utf-8')

        logger.info(f"Saved train set: {train_path} ({len(train_df)} rows)")
        logger.info(f"Saved val set: {val_path} ({len(val_df)} rows)")
        logger.info(f"Saved test set: {test_path} ({len(test_df)} rows)")

    def save_language_splits(self, df: pd.DataFrame, output_dir: Path) -> None:
        """
        Save separate splits for each language.

        Args:
            df: Complete DataFrame
            output_dir: Output directory path
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        for language in df['language'].unique():
            lang_df = df[df['language'] == language]

            train_df, val_df, test_df = self.splitter.multi_stratified_split(
                lang_df, train_size=0.8, val_size=0.1, test_size=0.1,
                stratify_cols=['label', 'category']
            )

            lang_name = self.language_names.get(language, language)
            lang_dir = output_dir / language
            lang_dir.mkdir(parents=True, exist_ok=True)

            train_df.to_csv(lang_dir / 'train.csv',
                            index=False, encoding='utf-8')
            val_df.to_csv(lang_dir / 'val.csv', index=False, encoding='utf-8')
            test_df.to_csv(lang_dir / 'test.csv',
                           index=False, encoding='utf-8')

            logger.info(f"Saved {lang_name} splits to {lang_dir}")

    def generate_statistics_report(self, df: pd.DataFrame,
                                   output_dir: Path) -> None:
        """
        Generate and save dataset statistics report.

        Args:
            df: Dataset DataFrame
            output_dir: Output directory path
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        report_lines = [
            "="*80,
            "DATASET GENERATION REPORT",
            "="*80,
            "",
            f"Total Samples: {len(df)}",
            f"",
            "LABEL DISTRIBUTION:",
            f"  Toxic: {len(df[df['label'] == 1])} ({len(df[df['label'] == 1])/len(df)*100:.1f}%)",
            f"  Safe: {len(df[df['label'] == 0])} ({len(df[df['label'] == 0])/len(df)*100:.1f}%)",
            "",
            "LANGUAGE DISTRIBUTION:",
        ]

        for lang in sorted(df['language'].unique()):
            count = len(df[df['language'] == lang])
            pct = count / len(df) * 100
            report_lines.append(
                f"  {self.language_names.get(lang, lang)}: {count} ({pct:.1f}%)")

        report_lines.extend(["", "CATEGORY DISTRIBUTION (all languages):"])
        for category in sorted(df['category'].unique()):
            count = len(df[df['category'] == category])
            pct = count / len(df) * 100
            report_lines.append(f"  {category}: {count} ({pct:.1f}%)")

        # Per-language category distribution
        report_lines.extend(["", "CATEGORY DISTRIBUTION BY LANGUAGE:"])
        for lang in sorted(df['language'].unique()):
            report_lines.append(f"\n  {self.language_names.get(lang, lang)}:")
            lang_df = df[df['language'] == lang]
            for category in sorted(lang_df['category'].unique()):
                count = len(lang_df[lang_df['category'] == category])
                report_lines.append(f"    {category}: {count}")

        report_lines.extend(["", "="*80])

        report_text = "\n".join(report_lines)

        report_path = output_dir / 'dataset_report.txt'
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_text)

        logger.info(f"Saved statistics report: {report_path}")
        print("\n" + report_text)

    # ========================================================================
    # MAIN PIPELINE
    # ========================================================================

    def generate(self, output_dir: str = 'outputs',
                 balance: bool = True) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Run complete dataset generation pipeline.

        Args:
            output_dir: Output directory path
            balance: Whether to balance toxic/safe ratio

        Returns:
            (train_df, val_df, test_df)
        """
        output_path = Path(output_dir)

        # Step 1: Generate data
        logger.info("\n" + "="*80)
        logger.info("STEP 1: GENERATING DATA")
        logger.info("="*80)
        df = self.generate_complete_dataset()

        # Step 2: Clean and process
        logger.info("\n" + "="*80)
        logger.info("STEP 2: CLEANING & PROCESSING")
        logger.info("="*80)
        df = self.shuffle_and_deduplicate(df)

        if balance:
            df = self.balance_dataset(df)

        # Step 3: Validate
        logger.info("\n" + "="*80)
        logger.info("STEP 3: VALIDATION")
        logger.info("="*80)
        validation_report = self.validator.full_validation_report(df)
        self.validator.print_report(validation_report)

        # Step 4: Split
        logger.info("\n" + "="*80)
        logger.info("STEP 4: SPLITTING DATASET")
        logger.info("="*80)
        train_df, val_df, test_df = self.splitter.multi_stratified_split(
            df, train_size=0.8, val_size=0.1, test_size=0.1,
            stratify_cols=['label', 'language', 'category']
        )
        self.splitter.print_split_stats(train_df, val_df, test_df)

        # Step 5: Save
        logger.info("\n" + "="*80)
        logger.info("STEP 5: SAVING DATASETS")
        logger.info("="*80)
        self.save_splits(train_df, val_df, test_df, output_path)
        self.save_language_splits(df, output_path / 'by_language')

        # Step 6: Report
        logger.info("\n" + "="*80)
        logger.info("STEP 6: GENERATING REPORTS")
        logger.info("="*80)
        self.generate_statistics_report(df, output_path)

        logger.info("\n" + "="*80)
        logger.info("DATASET GENERATION COMPLETE!")
        logger.info("="*80 + "\n")

        return train_df, val_df, test_df


def main():
    """Main execution function."""
    # Configuration
    OUTPUT_DIR = 'outputs'
    AUGMENT_COUNT = 2  # Number of augmentations per phrase
    BALANCE = True  # Balance toxic/safe ratio

    # Generate dataset
    generator = DatasetGenerator(seed=42, augment_count=AUGMENT_COUNT)
    train_df, val_df, test_df = generator.generate(
        output_dir=OUTPUT_DIR,
        balance=BALANCE
    )

    # Print final statistics
    print(f"\nFinal Dataset Statistics:")
    print(f"  Training set: {len(train_df)} rows")
    print(f"  Validation set: {len(val_df)} rows")
    print(f"  Test set: {len(test_df)} rows")
    print(f"  Total: {len(train_df) + len(val_df) + len(test_df)} rows")


if __name__ == '__main__':
    main()
