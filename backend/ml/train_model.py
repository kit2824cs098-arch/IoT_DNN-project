import os
import sys
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from preprocessing.pipeline import IoTDataPreprocessor
from dnn_model import PyTorchMLPClassifier
from xgboost_model import XGBoostBaseline
from tabpfn_model import TabPFNBaseline
from evaluate import evaluate_all_models

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "dataset", "synthetic_zone_events.csv")
    saved_dir = os.path.join(base_dir, "saved_models")
    os.makedirs(saved_dir, exist_ok=True)

    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"Dataset shape: {df.shape}")

    # Initialize and fit Preprocessor Pipeline
    print("Fitting IoT Data Preprocessor pipeline...")
    preprocessor = IoTDataPreprocessor()
    X_features = preprocessor.fit_transform(df)
    y_labels = df["is_unauthorized"].values

    # Save Preprocessor Pipeline
    preprocessor_path = os.path.join(saved_dir, "preprocessor.pkl")
    preprocessor.save(preprocessor_path)

    # Train / Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X_features, y_labels, test_size=0.20, random_state=42, stratify=y_labels
    )
    
    # Train / Validation Split for Early Stopping (80% Train, 20% Val)
    X_tr, X_val, y_tr, y_val = train_test_split(
        X_train, y_train, test_size=0.20, random_state=42, stratify=y_train
    )

    print(f"Train set: {len(X_tr)} | Validation set: {len(X_val)} | Test set: {len(X_test)}")

    # 1. Train PyTorch MLP DNN Classifier
    print("\n--- Training PyTorch MLP Deep Neural Network ---")
    pos_ratio = (len(y_tr) - np.sum(y_tr)) / max(1, np.sum(y_tr))
    mlp_model = PyTorchMLPClassifier(
        input_dim=X_features.shape[1],
        hidden_layers=[128, 64, 32],
        dropout_rate=0.25,
        learning_rate=0.001,
        batch_size=64,
        epochs=120,
        pos_weight=float(pos_ratio)
    )
    mlp_model.fit(X_tr, y_tr, X_val=X_val, y_val=y_val, patience=15)
    mlp_path = os.path.join(saved_dir, "dnn_model.pth")
    mlp_model.save(mlp_path)

    # 2. Train XGBoost Baseline
    print("\n--- Training XGBoost Baseline Classifier ---")
    xgb_model = XGBoostBaseline(n_estimators=150, max_depth=5, learning_rate=0.05)
    xgb_model.fit(X_tr, y_tr, X_val=X_val, y_val=y_val)
    xgb_path = os.path.join(saved_dir, "xgboost_model.pkl")
    xgb_model.save(xgb_path)

    # 3. Train TabPFN Baseline
    print("\n--- Training TabPFN Baseline Classifier ---")
    tabpfn_model = TabPFNBaseline()
    tabpfn_model.fit(X_tr, y_tr, X_val=X_val, y_val=y_val)
    tabpfn_path = os.path.join(saved_dir, "tabpfn_model.pkl")
    tabpfn_model.save(tabpfn_path)

    # Evaluate models on test set and export model_metrics.json
    print("\n--- Evaluating Models on Held-Out Test Set ---")
    metrics_path = os.path.join(base_dir, "model_metrics.json")
    metrics = evaluate_all_models(
        models={
            "MLP_DNN": mlp_model,
            "XGBoost": xgb_model,
            "TabPFN": tabpfn_model
        },
        X_test=X_test,
        y_test=y_test,
        output_filepath=metrics_path
    )

    print("\nTraining and Evaluation pipeline complete!")
    print(f"Metrics saved to: {metrics_path}")

if __name__ == "__main__":
    main()
