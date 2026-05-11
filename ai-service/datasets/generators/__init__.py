"""
Dataset generation package for multilingual toxic content detection.

Submodules:
    vocabulary: Multilingual vocabulary database
    generate_dataset: Main dataset generation pipeline
    augment_dataset: Data augmentation utilities
    validate_dataset: Dataset validation and quality assurance
    split_dataset: Train/validation/test splitting
"""

from .generate_dataset import DatasetGenerator, main
from .augment_dataset import DataAugmentor, create_augmentor
from .validate_dataset import DatasetValidator, create_validator
from .split_dataset import DatasetSplitter, create_splitter

__version__ = "1.0.0"
__author__ = "Dataset Generator Team"
__all__ = [
    'DatasetGenerator',
    'DataAugmentor',
    'DatasetValidator',
    'DatasetSplitter',
    'create_augmentor',
    'create_validator',
    'create_splitter',
    'main',
]
