import os
import torch
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate():
    model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "trained_model")
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datasets')
    test_path = os.path.join(data_dir, 'test.csv')
    
    if not os.path.exists(model_dir):
        print(f"Model directory not found at {model_dir}. Please run train.py first.")
        return
        
    if not os.path.exists(test_path):
        print("Test data not found. Run generate_dataset.py first.")
        return
        
    print(f"Loading model from {model_dir}...")
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    
    print("Loading test data...")
    test_df = pd.read_csv(test_path).dropna(subset=['text', 'label'])
    texts = test_df['text'].tolist()
    true_labels = test_df['label'].tolist()
    
    print("Running inference on test set...")
    batch_size = 16
    preds = []
    
    with torch.no_grad():
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            inputs = tokenizer(batch_texts, padding=True, truncation=True, max_length=128, return_tensors="pt").to(device)
            outputs = model(**inputs)
            logits = outputs.logits
            batch_preds = torch.argmax(logits, dim=-1).cpu().numpy()
            preds.extend(batch_preds)
            
    print("\n--- Evaluation Metrics ---")
    acc = accuracy_score(true_labels, preds)
    prec = precision_score(true_labels, preds)
    rec = recall_score(true_labels, preds)
    f1 = f1_score(true_labels, preds)
    
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    
    print("\n--- Classification Report ---")
    print(classification_report(true_labels, preds, target_names=['Non-Toxic', 'Toxic']))
    
    print("\nGenerating Confusion Matrix Plot...")
    cm = confusion_matrix(true_labels, preds)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Non-Toxic', 'Toxic'], yticklabels=['Non-Toxic', 'Toxic'])
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.title('Confusion Matrix - Toxicity Detection')
    
    plot_path = os.path.join(os.path.dirname(__file__), 'confusion_matrix.png')
    plt.savefig(plot_path)
    print(f"Confusion matrix saved to {plot_path}")

if __name__ == "__main__":
    evaluate()
