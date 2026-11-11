import os
import json
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
    roc_curve
)

def evaluate_all_models(models, X_test, y_test, output_filepath=None, threshold=0.5):
    """
    Evaluates MLP_DNN, XGBoost, and TabPFN baseline models on actual test predictions.
    Calculates exact Accuracy, Precision, Recall, F1, Confusion Matrix, and ROC-AUC.
    """
    metrics_summary = {}

    for model_name, model in models.items():
        probs = model.predict_proba(X_test)[:, 1]
        preds = (probs >= threshold).astype(int)

        acc = float(accuracy_score(y_test, preds))
        prec = float(precision_score(y_test, preds, zero_division=0))
        rec = float(recall_score(y_test, preds, zero_division=0))
        f1 = float(f1_score(y_test, preds, zero_division=0))
        auc = float(roc_auc_score(y_test, probs))
        
        cm = confusion_matrix(y_test, preds).tolist() # [[TN, FP], [FN, TP]]

        # Generate simplified ROC points (fpr, tpr) for dashboard visualization
        fpr, tpr, _ = roc_curve(y_test, probs)
        # Sample ~15 ROC points for UI chart rendering efficiency
        step = max(1, len(fpr) // 15)
        roc_points = [
            {"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
            for f, t in zip(fpr[::step], tpr[::step])
        ]

        metrics_summary[model_name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": cm, # [[TN, FP], [FN, TP]]
            "roc_curve": roc_points,
            "test_sample_count": int(len(y_test))
        }

    if output_filepath:
        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
        with open(output_filepath, "w") as f:
            json.dump(metrics_summary, f, indent=2)
        print(f"Model evaluation metrics written to: {output_filepath}")

    return metrics_summary
