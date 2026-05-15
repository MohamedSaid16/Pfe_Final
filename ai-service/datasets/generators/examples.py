"""
Example usage scenarios for dataset generation pipeline.
Demonstrates all major components and their usage.
"""

import pandas as pd
from pathlib import Path

# Import all components
from vocabulary import get_vocabulary, get_language_names, get_toxic_categories
from generate_dataset import DatasetGenerator
from augment_dataset import create_augmentor
from validate_dataset import create_validator
from split_dataset import create_splitter


def example_1_generate_full_dataset():
    """
    Example 1: Generate complete multilingual dataset with default settings.
    This is the most common use case.
    """
    print("\n" + "="*80)
    print("EXAMPLE 1: Generate Complete Multilingual Dataset")
    print("="*80 + "\n")

    # Create generator
    gen = DatasetGenerator(seed=42, augment_count=2)

    # Generate full dataset
    train_df, val_df, test_df = gen.generate(
        output_dir='outputs',
        balance=True
    )

    print("\nGeneration Complete!")
    print(f"Train: {len(train_df)} samples")
    print(f"Val: {len(val_df)} samples")
    print(f"Test: {len(test_df)} samples")
    print(f"Total: {len(train_df) + len(val_df) + len(test_df)} samples")


def example_2_custom_augmentation():
    """
    Example 2: Generate dataset with custom augmentation settings.
    Useful for creating datasets with different data augmentation levels.
    """
    print("\n" + "="*80)
    print("EXAMPLE 2: Generate with Custom Augmentation")
    print("="*80 + "\n")

    # Create generator with more augmentation
    gen = DatasetGenerator(seed=42, augment_count=5)

    # Generate dataset
    print("Generating dataset with 5x augmentation (more data)...")
    train_df, val_df, test_df = gen.generate(output_dir='outputs_augmented')

    print(f"\nWith 5x augmentation:")
    print(f"Train: {len(train_df)} samples (vs ~8000 with 2x)")
    print(f"Val: {len(val_df)} samples")
    print(f"Test: {len(test_df)} samples")


def example_3_single_language_dataset():
    """
    Example 3: Generate dataset for a single language.
    Useful for language-specific model training.
    """
    print("\n" + "="*80)
    print("EXAMPLE 3: Generate Single Language Dataset (English)")
    print("="*80 + "\n")

    gen = DatasetGenerator(seed=42, augment_count=2)

    # Generate only English data
    print("Generating English dataset...")
    english_data = gen.generate_language_dataset('en', min_per_category=500)
    english_df = pd.DataFrame(english_data)

    print(f"\nEnglish dataset generated:")
    print(f"Total samples: {len(english_df)}")
    print(f"Toxic: {len(english_df[english_df['label'] == 1])}")
    print(f"Safe: {len(english_df[english_df['label'] == 0])}")

    # Split and save
    splitter = create_splitter()
    train, val, test = splitter.stratified_split(english_df)

    print(f"\nSplit:")
    print(f"Train: {len(train)} samples (80%)")
    print(f"Val: {len(val)} samples (10%)")
    print(f"Test: {len(test)} samples (10%)")


def example_4_data_augmentation():
    """
    Example 4: Apply custom augmentation to existing texts.
    Useful for augmenting specific phrases.
    """
    print("\n" + "="*80)
    print("EXAMPLE 4: Apply Data Augmentation")
    print("="*80 + "\n")

    augmentor = create_augmentor(seed=42)

    # Original text
    text = "you are stupid"
    print(f"Original: {text}\n")

    # Generate augmented variants
    print("Augmentation variants:")
    variants = augmentor.augment_comprehensive(
        text, 'en', is_toxic=True, augmentation_count=5
    )

    for i, variant in enumerate(variants):
        print(f"  {i+1}. {variant}")

    # Show specific augmentation types
    print("\n\nSpecific Augmentation Types:")
    print(f"OCR noise: {augmentor.inject_ocr_noise(text, 0.1)}")
    print(f"ALL CAPS: {augmentor.capitalize_all(text)}")
    print(f"Punctuation: {augmentor.inject_punctuation_noise(text, 'heavy')}")
    print(f"Repeat chars: {augmentor.repeat_characters(text)}")
    print(f"With emoji: {augmentor.inject_emoji(text, is_toxic=True)}")


def example_5_dataset_validation():
    """
    Example 5: Validate dataset quality.
    Useful for checking dataset before using it for training.
    """
    print("\n" + "="*80)
    print("EXAMPLE 5: Dataset Validation")
    print("="*80 + "\n")

    # Load or generate a dataset
    gen = DatasetGenerator(seed=42, augment_count=1)
    df = gen.generate_complete_dataset()

    # Create validator
    validator = create_validator()

    # Run full validation
    print("Running full dataset validation...\n")
    report = validator.full_validation_report(df)

    # Print report
    validator.print_report(report)

    # Access specific metrics
    print("\nKey Metrics:")
    print(f"Dataset size: {report['dataset_size']}")
    print(f"Valid: {report['summary']['is_valid']}")
    print(
        f"Label balance ratio: {report['balance']['labels']['balance_ratio']:.2f}:1")
    print(
        f"Encoding issues: {report['encoding']['utf8_validation']['issues_count']}")


def example_6_train_val_test_split():
    """
    Example 6: Split dataset into train/validation/test sets.
    Shows stratified splitting that maintains class balance.
    """
    print("\n" + "="*80)
    print("EXAMPLE 6: Train/Validation/Test Split")
    print("="*80 + "\n")

    # Generate sample dataset
    gen = DatasetGenerator(seed=42, augment_count=1)
    df = gen.generate_complete_dataset()

    # Create splitter
    splitter = create_splitter(random_state=42)

    # Method 1: Simple stratified split by label
    print("Simple stratified split (by label):\n")
    train1, val1, test1 = splitter.stratified_split(
        df, train_size=0.8, val_size=0.1, test_size=0.1
    )
    print(f"Train: {len(train1)}, Val: {len(val1)}, Test: {len(test1)}")

    # Method 2: Multi-stratified split (by multiple columns)
    print("\nMulti-stratified split (by label, language, category):\n")
    train2, val2, test2 = splitter.multi_stratified_split(
        df, train_size=0.8, val_size=0.1, test_size=0.1,
        stratify_cols=['label', 'language', 'category']
    )
    print(f"Train: {len(train2)}, Val: {len(val2)}, Test: {len(test2)}")

    # Verify balance
    print("\nSplit verification:")
    splitter.print_split_stats(train2, val2, test2)


def example_7_vocabulary_exploration():
    """
    Example 7: Explore vocabulary database.
    Shows how to access and examine available phrases.
    """
    print("\n" + "="*80)
    print("EXAMPLE 7: Vocabulary Exploration")
    print("="*80 + "\n")

    vocab = get_vocabulary()
    lang_names = get_language_names()

    # Show available languages
    print("Available languages:")
    for code, name in lang_names.items():
        print(f"  {code}: {name}")

    # Explore English vocabulary
    print("\n\nEnglish Vocabulary:")
    en_toxic = vocab['en']['toxic']
    en_safe = vocab['en']['safe']

    print(f"Toxic categories: {len(en_toxic)}")
    for category, phrases in list(en_toxic.items())[:3]:
        print(f"  {category}: {len(phrases)} phrases")
        print(f"    Examples: {phrases[:2]}")

    print(f"\nSafe categories: {len(en_safe)}")
    for category, phrases in list(en_safe.items())[:3]:
        print(f"  {category}: {len(phrases)} phrases")
        print(f"    Examples: {phrases[:2]}")

    # Explore Darija
    print("\n\nAlgerian Darija Vocabulary:")
    dz_toxic = vocab['dz']['toxic']
    dz_insults = dz_toxic.get('insult', [])
    print(f"Insults: {len(dz_insults)} examples")
    print(f"  {dz_insults[:5]}")


def example_8_batch_processing():
    """
    Example 8: Process multiple texts efficiently.
    Shows batch augmentation for production use.
    """
    print("\n" + "="*80)
    print("EXAMPLE 8: Batch Processing")
    print("="*80 + "\n")

    augmentor = create_augmentor(seed=42)

    # Sample texts
    texts = [
        "you are stupid",
        "go away",
        "I hate you"
    ]

    print("Processing batch of toxic phrases:")
    for text in texts:
        print(f"  - {text}")

    # Batch augmentation
    print("\nBatch augmenting...")
    augmented = augmentor.batch_augment(texts, language='en', is_toxic=True)

    print(f"\nOriginal: {len(texts)} texts")
    print(f"After augmentation: {len(augmented)} texts")
    print(f"Augmentation ratio: {len(augmented)/len(texts):.1f}x")

    print("\nSample augmented texts:")
    for text in augmented[:5]:
        print(f"  - {text}")


def example_9_compare_languages():
    """
    Example 9: Generate and compare datasets across languages.
    Shows distribution differences between languages.
    """
    print("\n" + "="*80)
    print("EXAMPLE 9: Compare Across Languages")
    print("="*80 + "\n")

    gen = DatasetGenerator(seed=42, augment_count=1)

    print("Generating datasets for each language:\n")

    language_stats = {}
    for lang_code in ['en', 'fr', 'ar', 'dz']:
        data = gen.generate_language_dataset(lang_code, min_per_category=200)
        df = pd.DataFrame(data)

        toxic_count = len(df[df['label'] == 1])
        safe_count = len(df[df['label'] == 0])

        language_stats[lang_code] = {
            'total': len(df),
            'toxic': toxic_count,
            'safe': safe_count
        }

        print(
            f"{lang_code.upper()}: {len(df)} samples (Toxic: {toxic_count}, Safe: {safe_count})")

    print("\n\nLanguage Comparison:")
    for code, stats in language_stats.items():
        name = get_language_names()[code]
        ratio = stats['toxic'] / stats['safe'] if stats['safe'] > 0 else 0
        print(f"{name:20} | Total: {stats['total']:5} | Ratio: {ratio:.2f}:1")


def example_10_production_pipeline():
    """
    Example 10: Production pipeline for regular dataset updates.
    Shows complete workflow for maintaining datasets.
    """
    print("\n" + "="*80)
    print("EXAMPLE 10: Production Pipeline")
    print("="*80 + "\n")

    output_dir = Path('production_outputs')
    output_dir.mkdir(exist_ok=True)

    # Stage 1: Generate
    print("Stage 1: Generating dataset...")
    gen = DatasetGenerator(seed=42, augment_count=2)
    df = gen.generate_complete_dataset()

    # Stage 2: Validate
    print("Stage 2: Validating dataset...")
    validator = create_validator()
    df = validator.remove_duplicates(df)
    validation_report = validator.full_validation_report(df)

    is_valid = validation_report['summary']['is_valid']
    print(f"Validation result: {'PASSED' if is_valid else 'FAILED'}")

    if not is_valid:
        print("Validation failed! Check validation report.")
        validator.print_report(validation_report)
        return

    # Stage 3: Balance
    print("Stage 3: Balancing dataset...")
    df = gen.balance_dataset(df)

    # Stage 4: Split
    print("Stage 4: Splitting dataset...")
    splitter = create_splitter()
    train_df, val_df, test_df = splitter.multi_stratified_split(
        df, train_size=0.8, val_size=0.1, test_size=0.1,
        stratify_cols=['label', 'language', 'category']
    )

    # Stage 5: Save
    print("Stage 5: Saving datasets...")
    train_df.to_csv(output_dir / 'train.csv', index=False, encoding='utf-8')
    val_df.to_csv(output_dir / 'val.csv', index=False, encoding='utf-8')
    test_df.to_csv(output_dir / 'test.csv', index=False, encoding='utf-8')

    # Stage 6: Generate report
    print("Stage 6: Generating report...")
    gen.generate_statistics_report(df, output_dir)

    print(f"\n✅ Production pipeline complete!")
    print(f"Output saved to: {output_dir}")
    print(f"Train: {len(train_df)} samples")
    print(f"Val: {len(val_df)} samples")
    print(f"Test: {len(test_df)} samples")


def main():
    """Run selected examples."""

    examples = {
        '1': ('Generate Complete Dataset', example_1_generate_full_dataset),
        '2': ('Custom Augmentation', example_2_custom_augmentation),
        '3': ('Single Language', example_3_single_language_dataset),
        '4': ('Data Augmentation', example_4_data_augmentation),
        '5': ('Dataset Validation', example_5_dataset_validation),
        '6': ('Train/Val/Test Split', example_6_train_val_test_split),
        '7': ('Vocabulary Exploration', example_7_vocabulary_exploration),
        '8': ('Batch Processing', example_8_batch_processing),
        '9': ('Compare Languages', example_9_compare_languages),
        '10': ('Production Pipeline', example_10_production_pipeline),
    }

    print("\n" + "="*80)
    print("DATASET GENERATION EXAMPLES")
    print("="*80)
    print("\nAvailable examples:")
    for key, (name, _) in examples.items():
        print(f"  {key}. {name}")

    print("\n0. Run all examples")
    print("q. Quit\n")

    choice = input("Select example to run (or 'q' to quit): ").strip()

    if choice == 'q':
        return
    elif choice == '0':
        print("\nRunning all examples...")
        for _, func in examples.values():
            func()
    elif choice in examples:
        _, func = examples[choice]
        func()
    else:
        print("Invalid choice!")


if __name__ == '__main__':
    main()
