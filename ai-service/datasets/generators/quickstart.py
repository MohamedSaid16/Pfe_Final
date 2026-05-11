"""
Quick-start guide for dataset generation.
Run this file for a fast introduction to the dataset pipeline.
"""

from generate_dataset import DatasetGenerator
import sys
from pathlib import Path

# Add generators to path
sys.path.insert(0, str(Path(__file__).parent))


def quick_start():
    """Quick start guide with minimal setup."""

    print("\n" + "="*80)
    print("DATASET GENERATION - QUICK START")
    print("="*80 + "\n")

    print("This quick start will generate a small multilingual toxic content dataset.\n")

    # Step 1: Initialize
    print("Step 1: Initializing dataset generator...")
    gen = DatasetGenerator(seed=42, augment_count=1)
    print("  ✓ Generator initialized")

    # Step 2: Generate
    print("\nStep 2: Generating dataset...")
    print("  This may take 2-5 minutes depending on your hardware...")

    try:
        train_df, val_df, test_df = gen.generate(
            output_dir='quick_start_outputs',
            balance=True
        )

        print("\n  ✓ Dataset generation complete!")

        # Step 3: Summary
        print("\n" + "="*80)
        print("DATASET SUMMARY")
        print("="*80)

        total = len(train_df) + len(val_df) + len(test_df)

        print(f"\nTotal samples generated: {total:,}")
        print(f"  Training set:   {len(train_df):,} samples (80%)")
        print(f"  Validation set: {len(val_df):,} samples (10%)")
        print(f"  Test set:       {len(test_df):,} samples (10%)")

        print(f"\nLanguages included:")
        for lang in sorted(train_df['language'].unique()):
            count = len(train_df[train_df['language'] == lang])
            print(f"  - {lang.upper()}: {count} samples")

        print(f"\nLabel distribution:")
        toxic_count = len(train_df[train_df['label'] == 1])
        safe_count = len(train_df[train_df['label'] == 0])
        print(f"  Toxic samples: {toxic_count:,} (50%)")
        print(f"  Safe samples:  {safe_count:,} (50%)")

        print(f"\nOutput saved to: quick_start_outputs/")
        print(f"  - train.csv")
        print(f"  - val.csv")
        print(f"  - test.csv")
        print(f"  - dataset_report.txt (detailed statistics)")
        print(f"  - by_language/ (language-specific splits)")

        print("\n" + "="*80)
        print("NEXT STEPS")
        print("="*80)
        print("""
1. Explore the generated files:
   cat quick_start_outputs/dataset_report.txt
   head quick_start_outputs/train.csv

2. Load data in Python:
   import pandas as pd
   df = pd.read_csv('quick_start_outputs/train.csv')
   print(df.head())
   print(f"Shape: {df.shape}")

3. Check data by language:
   for lang in ['en', 'fr', 'ar', 'dz']:
       lang_data = df[df['language'] == lang]
       print(f"{lang}: {len(lang_data)} samples")

4. Generate larger dataset:
   Edit generate_dataset.py and change:
   - AUGMENT_COUNT = 5 (for more augmentation)
   - min_per_category = 1000 (for more phrases per category)

5. Learn more:
   - Read datasets/README.md for comprehensive documentation
   - Run examples.py for more advanced usage examples
   - Check vocabulary.py to see available phrases

6. Use in your model:
   from sklearn.model_selection import train_test_split
   
   train = pd.read_csv('quick_start_outputs/train.csv')
   X_train = train['text'].values
   y_train = train['label'].values
   
   # Train your model...
        """)

        print("="*80)
        print("✅ Quick start complete!\n")

    except Exception as e:
        print(f"\n❌ Error during generation: {e}")
        import traceback
        traceback.print_exc()


def show_menu():
    """Show menu options."""

    print("\n" + "="*80)
    print("DATASET GENERATION MENU")
    print("="*80 + "\n")

    print("1. Run quick start (recommended for first time)")
    print("2. Generate full production dataset")
    print("3. Explore vocabulary")
    print("4. Run all examples")
    print("5. Generate custom configuration")
    print("0. Exit\n")

    return input("Select option (0-5): ").strip()


def explore_vocabulary():
    """Explore available vocabulary."""
    from vocabulary import get_vocabulary, get_language_names

    print("\n" + "="*80)
    print("VOCABULARY EXPLORER")
    print("="*80 + "\n")

    vocab = get_vocabulary()
    lang_names = get_language_names()

    print("Available languages:")
    for code in ['en', 'fr', 'ar', 'dz']:
        print(f"  {code}: {lang_names[code]}")

    lang = input("\nSelect language (en/fr/ar/dz): ").strip().lower()

    if lang not in vocab:
        print("Invalid language!")
        return

    lang_vocab = vocab[lang]

    print(f"\n{lang_names[lang]} - Toxic categories:")
    toxic_cats = list(lang_vocab['toxic'].keys())
    for i, cat in enumerate(toxic_cats, 1):
        phrases = lang_vocab['toxic'][cat]
        print(f"  {i}. {cat}: {len(phrases)} phrases")

    print(f"\n{lang_names[lang]} - Safe categories:")
    safe_cats = list(lang_vocab['safe'].keys())
    for i, cat in enumerate(safe_cats, 1):
        phrases = lang_vocab['safe'][cat]
        print(f"  {i}. {cat}: {len(phrases)} phrases")

    cat_idx = input("\nSelect category number to view samples: ").strip()

    try:
        cat_idx = int(cat_idx)
        if 1 <= cat_idx <= len(toxic_cats):
            cat = toxic_cats[cat_idx - 1]
            phrases = lang_vocab['toxic'][cat]
        elif 1 <= cat_idx - len(toxic_cats) <= len(safe_cats):
            cat = safe_cats[cat_idx - len(toxic_cats) - 1]
            phrases = lang_vocab['safe'][cat]
        else:
            print("Invalid selection!")
            return

        print(f"\n{cat} - Sample phrases:")
        for phrase in phrases[:10]:
            print(f"  - {phrase}")
    except ValueError:
        print("Invalid input!")


def generate_custom():
    """Generate dataset with custom configuration."""

    print("\n" + "="*80)
    print("CUSTOM DATASET CONFIGURATION")
    print("="*80 + "\n")

    try:
        # Get user input
        output_dir = input(
            "Output directory (default: custom_outputs): ").strip()
        if not output_dir:
            output_dir = 'custom_outputs'

        augment_count = input(
            "Augmentation multiplier (default: 2, range: 1-10): ").strip()
        augment_count = int(augment_count) if augment_count else 2
        augment_count = max(1, min(10, augment_count))

        balance = input(
            "Balance toxic/safe ratio? (y/n, default: y): ").strip().lower()
        balance = balance != 'n'

        seed = input("Random seed (default: 42): ").strip()
        seed = int(seed) if seed else 42

        print(f"\nConfiguration:")
        print(f"  Output directory: {output_dir}")
        print(f"  Augmentation: {augment_count}x")
        print(f"  Balance: {'Yes' if balance else 'No'}")
        print(f"  Seed: {seed}")

        confirm = input("\nProceed with generation? (y/n): ").strip().lower()

        if confirm == 'y':
            print("\nGenerating...")
            gen = DatasetGenerator(seed=seed, augment_count=augment_count)
            train_df, val_df, test_df = gen.generate(
                output_dir=output_dir,
                balance=balance
            )

            print(f"\n✅ Dataset saved to {output_dir}/")
            print(
                f"   Train: {len(train_df)} | Val: {len(val_df)} | Test: {len(test_df)}")

    except Exception as e:
        print(f"Error: {e}")


def main():
    """Main menu loop."""

    while True:
        choice = show_menu()

        if choice == '0':
            print("\nGoodbye!")
            break
        elif choice == '1':
            quick_start()
        elif choice == '2':
            print("\nGenerating full production dataset...")
            gen = DatasetGenerator(seed=42, augment_count=3)
            train_df, val_df, test_df = gen.generate(
                output_dir='production_outputs',
                balance=True
            )
            print(f"✅ Complete! Output: production_outputs/")
        elif choice == '3':
            explore_vocabulary()
        elif choice == '4':
            print("\nRunning examples.py...")
            try:
                from examples import main as examples_main
                examples_main()
            except Exception as e:
                print(f"Error running examples: {e}")
        elif choice == '5':
            generate_custom()
        else:
            print("Invalid choice!")


if __name__ == '__main__':
    # Check if running with arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--quick':
            quick_start()
        else:
            print(f"Unknown argument: {sys.argv[1]}")
    else:
        # Show menu
        main()
