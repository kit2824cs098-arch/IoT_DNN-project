import os
import joblib
import numpy as np

class TabPFNBaseline:
    """
    TabPFN 2.5 baseline classifier for tabular IoT dataset comparison.
    Falls back to LightGBM / HistGradientBoosting if TabPFN offline constraints apply.
    """
    def __init__(self, device="cpu"):
        self.device = device
        self.model = None
        self.is_fallback = False

    def fit(self, X, y, X_val=None, y_val=None):
        # Sample training data for TabPFN if sample size is large
        n_samples = min(len(X), 1000)
        idx = np.random.choice(len(X), n_samples, replace=False)
        X_sub = X[idx] if isinstance(X, np.ndarray) else X.iloc[idx]
        y_sub = y[idx] if isinstance(y, np.ndarray) else y.iloc[idx]

        try:
            from tabpfn import TabPFNClassifier
            print("Attempting TabPFN fit...")
            self.model = TabPFNClassifier(device=self.device, N_ensemble_configurations=4)
            self.model.fit(X_sub, y_sub)
            print("TabPFN fit successful.")
        except Exception as e:
            print(f"TabPFN unavailable or network restricted ({e}). Using LightGBM baseline for TabPFN metric comparison.")
            from lightgbm import LGBMClassifier
            self.is_fallback = True
            self.model = LGBMClassifier(
                n_estimators=100,
                learning_rate=0.05,
                max_depth=4,
                random_state=42,
                verbosity=-1
            )
            self.model.fit(X, y)
        return self

    def predict_proba(self, X):
        if self.model is None:
            raise RuntimeError("TabPFN model is not fitted.")
        return self.model.predict_proba(X)

    def predict(self, X, threshold=0.5):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)

    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        meta = {
            "model": self.model,
            "is_fallback": self.is_fallback
        }
        joblib.dump(meta, filepath)
        print(f"TabPFN baseline saved to {filepath}")

    def load(self, filepath):
        meta = joblib.load(filepath)
        self.model = meta["model"]
        self.is_fallback = meta.get("is_fallback", False)
        print(f"Loaded TabPFN baseline from {filepath}")
        return self
