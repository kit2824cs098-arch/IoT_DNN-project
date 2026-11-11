import os
import joblib
from xgboost import XGBClassifier

class XGBoostBaseline:
    """
    XGBoost baseline model for comparison against the MLP DNN.
    """
    def __init__(self, n_estimators=150, max_depth=5, learning_rate=0.05, random_state=42):
        self.model = XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            eval_metric="logloss",
            random_state=random_state
        )

    def fit(self, X, y, X_val=None, y_val=None):
        if X_val is not None and y_val is not None:
            self.model.fit(X, y, eval_set=[(X_val, y_val)], verbose=False)
        else:
            self.model.fit(X, y)
        return self

    def predict_proba(self, X):
        return self.model.predict_proba(X)

    def predict(self, X, threshold=0.5):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)

    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.model, filepath)
        print(f"XGBoost baseline model saved to {filepath}")

    def load(self, filepath):
        self.model = joblib.load(filepath)
        print(f"Loaded XGBoost baseline model from {filepath}")
        return self
