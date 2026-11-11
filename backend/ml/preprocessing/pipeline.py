import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder

class IoTDataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.categorical_cols = [
            "zone_type", 
            "worker_auth_status", 
            "rfid_detection_status", 
            "uwb_location_info", 
            "gps_location", 
            "entry_exit_status"
        ]
        self.numerical_cols = [
            "latitude",
            "longitude",
            "distance_from_permitted_zone_boundary",
            "duration_inside_zone",
            "previous_zone_entry_history",
            "restricted_zone_indicator",
            "entry_hour",
            "sensor_anomaly_score"
        ]
        self.encoder = None
        self.feature_names = []
        self.is_fitted = False

    def _compute_derived_features(self, df):
        """
        Derives engineered features from raw IoT payload inputs.
        Note: worker_id is intentionally NOT used directly as a raw numeric feature.
        """
        data = df.copy()

        # Handle entry time / entry hour
        if "entry_hour" not in data.columns:
            if "entry_time" in data.columns and data["entry_time"].notna().all():
                try:
                    data["entry_hour"] = pd.to_datetime(data["entry_time"]).dt.hour
                except Exception:
                    data["entry_hour"] = 12
            else:
                data["entry_hour"] = 12

        # Ensure required numerical columns exist with defaults
        defaults = {
            "latitude": 37.7749,
            "longitude": -122.4194,
            "distance_from_permitted_zone_boundary": 0.0,
            "duration_inside_zone": 0,
            "previous_zone_entry_history": 0,
            "restricted_zone_indicator": 0
        }
        for col, default_val in defaults.items():
            if col not in data.columns:
                data[col] = default_val

        # Calculate composite sensor anomaly score (0.0 to 1.0)
        anomaly_scores = []
        for idx, row in data.iterrows():
            score = 0.0
            rfid = str(row.get("rfid_detection_status", "DETECTED_VALID"))
            uwb = str(row.get("uwb_location_info", "PRECISION_HIGH"))
            gps = str(row.get("gps_location", "LOCK_3D"))
            
            if rfid in ["SIGNAL_SPOOFED", "DETECTED_INVALID"]:
                score += 0.45
            elif rfid == "NOT_DETECTED":
                score += 0.25
                
            if uwb in ["DRIFT_HIGH", "UNRELIABLE"]:
                score += 0.30
                
            if gps in ["DEGRADED", "NO_FIX"]:
                score += 0.25
                
            anomaly_scores.append(min(1.0, score))
            
        data["sensor_anomaly_score"] = anomaly_scores
        return data

    def fit(self, df):
        """Fits encoder and scaler on training DataFrame."""
        processed_df = self._compute_derived_features(df)
        
        # Fit OneHotEncoder on categorical features
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        cat_encoded = self.encoder.fit_transform(processed_df[self.categorical_cols])
        encoded_cat_names = self.encoder.get_feature_names_out(self.categorical_cols).tolist()
        
        # Fit StandardScaler on numerical features
        num_scaled = self.scaler.fit_transform(processed_df[self.numerical_cols])
        
        self.feature_names = encoded_cat_names + self.numerical_cols
        self.is_fitted = True
        return self

    def transform(self, df_or_dict):
        """
        Transforms input DataFrame or single IoT payload dictionary into scaled feature matrix.
        """
        if not self.is_fitted:
            raise RuntimeError("Preprocessor must be fitted before calling transform().")

        if isinstance(df_or_dict, dict):
            df = pd.DataFrame([df_or_dict])
        else:
            df = df_or_dict.copy()

        processed_df = self._compute_derived_features(df)

        # Categorical encoding
        cat_encoded = self.encoder.transform(processed_df[self.categorical_cols])
        
        # Numerical scaling
        num_scaled = self.scaler.transform(processed_df[self.numerical_cols])
        
        # Combine features
        features = np.hstack([cat_encoded, num_scaled])
        return features

    def fit_transform(self, df):
        self.fit(df)
        return self.transform(df)

    def save(self, filepath):
        """Saves preprocessor object to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)
        print(f"Preprocessor pipeline saved to {filepath}")

    @staticmethod
    def load(filepath):
        """Loads fitted preprocessor pipeline from disk."""
        preprocessor = joblib.load(filepath)
        print(f"Loaded preprocessor pipeline from {filepath}")
        return preprocessor
