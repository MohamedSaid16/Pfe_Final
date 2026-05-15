"""
Dataset splitting module for train/validation/test splits.
Maintains balance across splits and language diversity.
"""

import pandas as pd
import numpy as np
from typing import Tuple, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatasetSplitter:
    """Split dataset into train/validation/test sets."""

    def __init__(self, random_state: int = 42):
        """
        Initialize splitter.

        Args:
            random_state: Random seed for reproducibility
        """
        self.random_state = random_state
        np.random.seed(random_state)

    # ========================================================================
    # STRATIFIED SPLITTING
    # ========================================================================

    def stratified_split(self, df: pd.DataFrame,
                         train_size: float = 0.8,
                         val_size: float = 0.1,
                         test_size: float = 0.1,
                         stratify_by: str = 'label') -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split dataset maintaining class balance (stratified split).

        Args:
            df: Input DataFrame
            train_size: Proportion for training (0.0-1.0)
            val_size: Proportion for validation
            test_size: Proportion for testing
            stratify_by: Column to stratify by (usually 'label')

        Returns:
            (train_df, val_df, test_df)
        """
        # Validate proportions
        total = train_size + val_size + test_size
        if abs(total - 1.0) > 0.001:
            logger.warning(f"Split sizes sum to {total}, normalizing...")
            train_size /= total
            val_size /= total
            test_size /= total

        # Shuffle DataFrame
        df = df.sample(
            frac=1, random_state=self.random_state).reset_index(drop=True)

        # Split maintaining balance
        if stratify_by and stratify_by in df.columns:
            train_df, val_test_df = self._stratified_split_binary(
                df, train_size, stratify_by
            )

            # Adjust val_size relative to remaining data
            val_size_adjusted = val_size / (val_size + test_size)
            val_df, test_df = self._stratified_split_binary(
                val_test_df, val_size_adjusted, stratify_by
            )
        else:
            # Simple split if stratification not possible
            train_idx = int(len(df) * train_size)
            val_idx = train_idx + int(len(df) * val_size)

            train_df = df[:train_idx]
            val_df = df[train_idx:val_idx]
            test_df = df[val_idx:]

        logger.info(
            f"Dataset split - Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
        return train_df.reset_index(drop=True), val_df.reset_index(drop=True), test_df.reset_index(drop=True)

    @staticmethod
    def _stratified_split_binary(df: pd.DataFrame, split_ratio: float,
                                 stratify_by: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Split binary while maintaining stratification."""
        train_dfs = []
        test_dfs = []

        for group_val in df[stratify_by].unique():
            group = df[df[stratify_by] == group_val]
            group = group.sample(frac=1).reset_index(drop=True)

            split_idx = int(len(group) * split_ratio)
            train_dfs.append(group[:split_idx])
            test_dfs.append(group[split_idx:])

        train_split = pd.concat(train_dfs, ignore_index=True)
        test_split = pd.concat(test_dfs, ignore_index=True)

        return train_split, test_split

    # ========================================================================
    # MULTI-STRATIFIED SPLITTING
    # ========================================================================

    def multi_stratified_split(self, df: pd.DataFrame,
                               train_size: float = 0.8,
                               val_size: float = 0.1,
                               test_size: float = 0.1,
                               stratify_cols: list = None) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split maintaining balance across multiple columns.

        Args:
            df: Input DataFrame
            train_size, val_size, test_size: Split proportions
            stratify_cols: Columns to stratify by (e.g., ['label', 'language'])

        Returns:
            (train_df, val_df, test_df)
        """
        if not stratify_cols:
            stratify_cols = ['label', 'language']

        # Validate stratify columns exist
        stratify_cols = [col for col in stratify_cols if col in df.columns]

        if not stratify_cols:
            logger.warning(
                "No valid stratify columns found, using simple split")
            return self.stratified_split(df, train_size, val_size, test_size)

        # Create group identifier
        df['_group'] = df[stratify_cols].apply(lambda x: tuple(x), axis=1)

        train_dfs = []
        val_dfs = []
        test_dfs = []

        for group_val in df['_group'].unique():
            group = df[df['_group'] == group_val].copy()
            group = group.sample(
                frac=1, random_state=self.random_state).reset_index(drop=True)

            train_idx = int(len(group) * train_size)
            val_idx = train_idx + int(len(group) * val_size)

            train_dfs.append(group[:train_idx])
            val_dfs.append(group[train_idx:val_idx])
            test_dfs.append(group[val_idx:])

        train_df = pd.concat(train_dfs, ignore_index=True)
        val_df = pd.concat(val_dfs, ignore_index=True)
        test_df = pd.concat(test_dfs, ignore_index=True)

        # Remove temporary column
        train_df = train_df.drop('_group', axis=1)
        val_df = val_df.drop('_group', axis=1)
        test_df = test_df.drop('_group', axis=1)

        logger.info(
            f"Multi-stratified split - Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
        return train_df, val_df, test_df

    # ========================================================================
    # VERIFICATION
    # ========================================================================

    def verify_split_balance(self, train_df: pd.DataFrame,
                             val_df: pd.DataFrame,
                             test_df: pd.DataFrame) -> Dict[str, any]:
        """
        Verify that splits maintain proper balance.

        Args:
            train_df, val_df, test_df: Split DataFrames

        Returns:
            Dictionary with balance statistics
        """
        total = len(train_df) + len(val_df) + len(test_df)

        result = {
            'total_samples': total,
            'train': {
                'count': len(train_df),
                'percentage': (len(train_df) / total) * 100,
                'label_distribution': train_df['label'].value_counts().to_dict() if 'label' in train_df.columns else None,
            },
            'val': {
                'count': len(val_df),
                'percentage': (len(val_df) / total) * 100,
                'label_distribution': val_df['label'].value_counts().to_dict() if 'label' in val_df.columns else None,
            },
            'test': {
                'count': len(test_df),
                'percentage': (len(test_df) / total) * 100,
                'label_distribution': test_df['label'].value_counts().to_dict() if 'label' in test_df.columns else None,
            }
        }

        # Check language distribution
        if 'language' in train_df.columns:
            result['language_distribution'] = {
                'train': train_df['language'].value_counts().to_dict(),
                'val': val_df['language'].value_counts().to_dict(),
                'test': test_df['language'].value_counts().to_dict(),
            }

        return result

    def print_split_stats(self, train_df: pd.DataFrame,
                          val_df: pd.DataFrame,
                          test_df: pd.DataFrame) -> None:
        """Pretty-print split statistics."""
        stats = self.verify_split_balance(train_df, val_df, test_df)

        print("\n" + "="*80)
        print("DATASET SPLIT STATISTICS")
        print("="*80)

        print(f"\nTotal Samples: {stats['total_samples']}")

        print(
            f"\nTrain Set: {stats['train']['count']} ({stats['train']['percentage']:.1f}%)")
        if stats['train']['label_distribution']:
            print(
                f"  Label Distribution: {stats['train']['label_distribution']}")

        print(
            f"\nValidation Set: {stats['val']['count']} ({stats['val']['percentage']:.1f}%)")
        if stats['val']['label_distribution']:
            print(
                f"  Label Distribution: {stats['val']['label_distribution']}")

        print(
            f"\nTest Set: {stats['test']['count']} ({stats['test']['percentage']:.1f}%)")
        if stats['test']['label_distribution']:
            print(
                f"  Label Distribution: {stats['test']['label_distribution']}")

        if 'language_distribution' in stats:
            print(f"\nLanguage Distribution:")
            print(f"  Train: {stats['language_distribution']['train']}")
            print(f"  Val: {stats['language_distribution']['val']}")
            print(f"  Test: {stats['language_distribution']['test']}")

        print("\n" + "="*80 + "\n")


def create_splitter(random_state: int = 42) -> DatasetSplitter:
    """Factory function to create splitter."""
    return DatasetSplitter(random_state=random_state)
