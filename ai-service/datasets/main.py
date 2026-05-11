#!/usr/bin/env python
"""
Multilingual Toxic Content Detection - Dataset Generation Entry Point

This is the main entry point for generating the dataset.
Run this file to start the interactive menu or generate datasets.

Usage:
    python main.py                    # Interactive menu
    python main.py --quick            # Quick start
    python main.py --full             # Full generation
    python main.py --examples         # Run examples
"""

from split_dataset import create_splitter
from validate_dataset import create_validator
from augment_dataset import create_augmentor
from generate_dataset import DatasetGenerator
import sys
import os
from pathlib import Path

# Add generators to path
sys.path.insert(0, str(Path(__file__).parent / 'generators'))


def show_banner():
    """Show welcome banner."""
    banner = """
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   MULTILINGUAL TOXIC CONTENT DETECTION - DATASET GENERATION           ║
║                                                                        ║
║   Supports: English, French, Arabic, Algerian Darija                  ║
║   Features: 40,000+ examples, Augmentation, Validation               ║
║   Status: Production Ready                                            ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
    """
    print(banner)


def show_menu():
    """Display main menu."""
    menu = """
MAIN MENU
═════════

1. 🚀 Quick Start (recommended for first-time users)
2. 📊 Generate Full Dataset (complete 40,000+ examples)
3. ⚡ Generate Fast (minimal augmentation, faster generation)
4. 🔧 Custom Configuration (configure parameters)
5. 📚 Run Examples (10 detailed usage examples)
6. 🔍 Explore Vocabulary (browse available phrases)
7. ✅ Validate Existing Dataset
8. 📖 View Documentation
9. ℹ️  System Information
0. ❌ Exit

    """
    print(menu)


def quick_start():
    """Run quick start guide."""
    print("\n" + "="*70)
    print("QUICK START - Generating sample dataset")
    print("="*70 + "\n")

    print("This will generate a sample dataset in ~2-3 minutes...\n")

    try:
        gen = DatasetGenerator(seed=42, augment_count=1)
        train, val, test = gen.generate(output_dir='outputs_quickstart')

        total = len(train) + len(val) + len(test)
        print(f"\n✅ SUCCESS!")
        print(f"Generated {total:,} samples")
        print(
            f"  Train: {len(train):,} | Val: {len(val):,} | Test: {len(test):,}")
        print(f"Output: outputs_quickstart/")
        print(f"  - train.csv")
        print(f"  - val.csv")
        print(f"  - test.csv")
        print(f"  - dataset_report.txt\n")

    except Exception as e:
        print(f"❌ Error: {e}\n")


def full_generation():
    """Generate complete dataset."""
    print("\n" + "="*70)
    print("FULL DATASET GENERATION")
    print("="*70 + "\n")

    print("Generating complete dataset with 2x augmentation...")
    print("This will take 5-10 minutes depending on your hardware.\n")

    try:
        gen = DatasetGenerator(seed=42, augment_count=2)
        train, val, test = gen.generate(output_dir='outputs')

        total = len(train) + len(val) + len(test)
        print(f"\n✅ SUCCESS!")
        print(f"Generated {total:,} samples total")
        print(f"Output: outputs/\n")

    except Exception as e:
        print(f"❌ Error: {e}\n")


def fast_generation():
    """Generate dataset quickly."""
    print("\n" + "="*70)
    print("FAST GENERATION (minimal augmentation)")
    print("="*70 + "\n")

    print("Generating dataset without augmentation...")
    print("This will take 2-3 minutes.\n")

    try:
        gen = DatasetGenerator(seed=42, augment_count=0)
        train, val, test = gen.generate(output_dir='outputs_fast')

        total = len(train) + len(val) + len(test)
        print(f"\n✅ SUCCESS!")
        print(f"Generated {total:,} samples")
        print(f"Output: outputs_fast/\n")

    except Exception as e:
        print(f"❌ Error: {e}\n")


def custom_config():
    """Generate with custom configuration."""
    print("\n" + "="*70)
    print("CUSTOM CONFIGURATION")
    print("="*70 + "\n")

    try:
        output_dir = input(
            "Output directory (default: outputs_custom): ").strip()
        if not output_dir:
            output_dir = 'outputs_custom'

        augment = input(
            "Augmentation factor (default: 2, range: 0-10): ").strip()
        augment = int(augment) if augment else 2
        augment = max(0, min(10, augment))

        balance = input(
            "Balance toxic/safe (y/n, default: y): ").strip().lower()
        balance = balance != 'n'

        seed = input("Random seed (default: 42): ").strip()
        seed = int(seed) if seed else 42

        print(f"\nConfiguration:")
        print(f"  Output: {output_dir}")
        print(f"  Augmentation: {augment}x")
        print(f"  Balance: {balance}")
        print(f"  Seed: {seed}")

        confirm = input("\nProceed (y/n): ").strip().lower()

        if confirm == 'y':
            gen = DatasetGenerator(seed=seed, augment_count=augment)
            train, val, test = gen.generate(
                output_dir=output_dir, balance=balance)

            total = len(train) + len(val) + len(test)
            print(f"\n✅ Generated {total:,} samples to {output_dir}/\n")

    except Exception as e:
        print(f"❌ Error: {e}\n")


def run_examples():
    """Run example scripts."""
    print("\n" + "="*70)
    print("EXAMPLE SCRIPTS")
    print("="*70 + "\n")

    try:
        # Import examples module
        sys.path.insert(0, str(Path(__file__).parent / 'generators'))
        from examples import main as examples_main
        examples_main()
    except Exception as e:
        print(f"❌ Error running examples: {e}\n")


def explore_vocabulary():
    """Explore vocabulary interactively."""
    print("\n" + "="*70)
    print("VOCABULARY EXPLORER")
    print("="*70 + "\n")

    try:
        sys.path.insert(0, str(Path(__file__).parent / 'generators'))
        from vocabulary import get_vocabulary, get_language_names

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
            count = len(lang_vocab['toxic'][cat])
            print(f"  {i}. {cat}: {count} phrases")

        cat = input(f"\nSelect category (1-{len(toxic_cats)}): ").strip()

        try:
            idx = int(cat) - 1
            if 0 <= idx < len(toxic_cats):
                cat_name = toxic_cats[idx]
                phrases = lang_vocab['toxic'][cat_name]

                print(f"\n{cat_name.upper()} - Sample phrases:")
                for phrase in phrases[:15]:
                    print(f"  • {phrase}")
        except ValueError:
            pass

    except Exception as e:
        print(f"❌ Error: {e}\n")


def validate_dataset():
    """Validate existing dataset."""
    print("\n" + "="*70)
    print("DATASET VALIDATION")
    print("="*70 + "\n")

    csv_file = input("Path to CSV file: ").strip()

    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}\n")
        return

    try:
        import pandas as pd

        print("Loading dataset...")
        df = pd.read_csv(csv_file, encoding='utf-8')

        print("Validating...")
        validator = create_validator()
        report = validator.full_validation_report(df)
        validator.print_report(report)

    except Exception as e:
        print(f"❌ Error: {e}\n")


def view_documentation():
    """Show documentation options."""
    print("\n" + "="*70)
    print("DOCUMENTATION")
    print("="*70 + "\n")

    docs = {
        '1': ('README.md', 'Main usage guide'),
        '2': ('ARCHITECTURE.md', 'Technical architecture'),
        '3': ('SUMMARY.md', 'Complete summary'),
    }

    for key, (file, desc) in docs.items():
        print(f"{key}. {desc} ({file})")

    choice = input("\nSelect document (1-3) or press Enter to skip: ").strip()

    if choice in docs:
        file, _ = docs[choice]
        doc_path = Path(__file__).parent / file

        if doc_path.exists():
            with open(doc_path, 'r', encoding='utf-8') as f:
                content = f.read()
                print("\n" + content[:2000] +
                      "\n... [Document truncated] ...\n")
        else:
            print(f"❌ File not found: {file}\n")


def system_info():
    """Show system information."""
    print("\n" + "="*70)
    print("SYSTEM INFORMATION")
    print("="*70 + "\n")

    try:
        import platform
        import pandas as pd

        print(f"Python Version: {platform.python_version()}")
        print(f"Platform: {platform.platform()}")
        print(f"Pandas: {pd.__version__}")

        # Check installed packages
        print("\nRequired Packages:")
        print("  ✓ pandas")
        print("  ✓ numpy (via pandas)")

        # Check dataset structure
        print("\nDataset Structure:")
        base_path = Path(__file__).parent

        if (base_path / 'generators').exists():
            print(f"  ✓ generators/ (scripts)")

            generator_files = list((base_path / 'generators').glob('*.py'))
            print(f"    - {len(generator_files)} Python files")

        if (base_path / 'outputs').exists():
            output_files = list((base_path / 'outputs').glob('*.csv'))
            print(f"  ✓ outputs/ ({len(output_files)} CSV files)")

        print(f"\n✅ System ready for dataset generation\n")

    except Exception as e:
        print(f"❌ Error: {e}\n")


def main():
    """Main execution."""

    # Check for command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--quick':
            show_banner()
            quick_start()
            return
        elif sys.argv[1] == '--full':
            show_banner()
            full_generation()
            return
        elif sys.argv[1] == '--examples':
            show_banner()
            run_examples()
            return
        else:
            print(f"Unknown argument: {sys.argv[1]}")
            return

    # Interactive menu
    while True:
        show_banner()
        show_menu()

        choice = input("Select option (0-9): ").strip()

        if choice == '0':
            print("\n👋 Goodbye!\n")
            break
        elif choice == '1':
            quick_start()
        elif choice == '2':
            full_generation()
        elif choice == '3':
            fast_generation()
        elif choice == '4':
            custom_config()
        elif choice == '5':
            run_examples()
        elif choice == '6':
            explore_vocabulary()
        elif choice == '7':
            validate_dataset()
        elif choice == '8':
            view_documentation()
        elif choice == '9':
            system_info()
        else:
            print("❌ Invalid option!\n")

        input("Press Enter to continue...")


if __name__ == '__main__':
    main()
