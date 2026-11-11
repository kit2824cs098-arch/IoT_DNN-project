import os
import sys
import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from preprocessing.pipeline import IoTDataPreprocessor
from dnn_model import PyTorchMLPClassifier

class WorkerSafetyPredictor:
    def __init__(self, model_dir=None, threshold=0.50):
        if model_dir is None:
            model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")
            
        preprocessor_path = os.path.join(model_dir, "preprocessor.pkl")
        model_path = os.path.join(model_dir, "dnn_model.pth")
        
        self.preprocessor = IoTDataPreprocessor.load(preprocessor_path)
        self.model = PyTorchMLPClassifier()
        self.model.load(model_path)
        self.threshold = threshold

    def _generate_explainability(self, iot_event, raw_prob, features):
        """
        Generates human-readable explainability factor breakdown for the prediction.
        Analyzes key sensor inputs and feature deviations.
        """
        factors = []
        
        # 1. Distance factor
        dist = float(iot_event.get("distance_from_permitted_zone_boundary", 0.0))
        if dist > 5.0:
            factors.append({
                "feature": "distance_from_permitted_zone_boundary",
                "impact": f"High spatial boundary breach ({dist:.1f} meters outside safe perimeter)",
                "weight": "HIGH"
            })
        elif dist > 2.0:
            factors.append({
                "feature": "distance_from_permitted_zone_boundary",
                "impact": f"Proximity warning ({dist:.1f} meters near boundary limit)",
                "weight": "MEDIUM"
            })

        # 2. Worker authorization factor
        auth = str(iot_event.get("worker_auth_status", "UNKNOWN")).upper()
        if auth in ["REVOKED", "EXPIRED", "VISITOR"]:
            factors.append({
                "feature": "worker_auth_status",
                "impact": f"Unauthorized credential status: '{auth}'",
                "weight": "HIGH"
            })

        # 3. RFID Sensor Status
        rfid = str(iot_event.get("rfid_detection_status", "DETECTED_VALID")).upper()
        if rfid in ["SIGNAL_SPOOFED", "DETECTED_INVALID"]:
            factors.append({
                "feature": "rfid_detection_status",
                "impact": f"RFID anomaly detected: '{rfid}'",
                "weight": "HIGH"
            })
        elif rfid == "NOT_DETECTED":
            factors.append({
                "feature": "rfid_detection_status",
                "impact": "Worker RFID transponder missing or unreadable",
                "weight": "MEDIUM"
            })

        # 4. Zone Restriction & Duration
        restricted = bool(iot_event.get("restricted_zone_indicator", 0))
        duration = int(iot_event.get("duration_inside_zone", 0))
        if restricted and duration > 1800:
            factors.append({
                "feature": "duration_inside_zone",
                "impact": f"Excessive duration inside high-risk zone ({duration // 60} mins)",
                "weight": "MEDIUM"
            })

        # 5. Violation history
        history = int(iot_event.get("previous_zone_entry_history", 0))
        if history >= 2:
            factors.append({
                "feature": "previous_zone_entry_history",
                "impact": f"Repeat offender history ({history} prior violations)",
                "weight": "LOW"
            })

        if not factors:
            factors.append({
                "feature": "general_clearance",
                "impact": "Worker credentials and spatial coordinates verified within normal limits",
                "weight": "NONE"
            })

        return factors

    def predict(self, iot_event, custom_threshold=None):
        """
        Receives raw IoT JSON event dictionary and returns DNN prediction output.
        """
        thresh = custom_threshold if custom_threshold is not None else self.threshold
        
        # Transform IoT payload into scaled model feature matrix
        X_feature = self.preprocessor.transform(iot_event)
        
        # Model inference probability for UNAUTHORIZED class (class 1)
        probs = self.model.predict_proba(X_feature)[0]
        prob_unauth = float(probs[1])
        prob_safe = float(probs[0])
        
        is_unauth = prob_unauth >= thresh
        prediction = "UNAUTHORIZED" if is_unauth else "SAFE"
        
        # Risk score scaled 0.0 - 100.0
        risk_score = round(prob_unauth * 100.0, 1)
        
        # Confidence score (distance from decision uncertainty 0.50)
        confidence = round(float(np.abs(prob_unauth - 0.5) * 2.0), 3) # Scaled 0.0 to 1.0
        
        alert_required = bool(is_unauth)

        # Generate explainability factors
        explanation = self._generate_explainability(iot_event, prob_unauth, X_feature)

        output = {
            "worker_id": str(iot_event.get("worker_id", "UNKNOWN_WORKER")),
            "zone_id": str(iot_event.get("zone_id", "UNKNOWN_ZONE")),
            "prediction": prediction,
            "risk_score": risk_score,
            "confidence": confidence,
            "alert_required": alert_required,
            "unauthorized_probability": round(prob_unauth, 4),
            "threshold_used": thresh,
            "explainability": {
                "top_factors": explanation
            }
        }
        return output

if __name__ == "__main__":
    predictor = WorkerSafetyPredictor()
    
    # Sample Test IoT Payload 1: Safe Entry
    safe_event = {
        "worker_id": "WRK-1012",
        "zone_id": "ZONE-A-ASSEMBLY",
        "zone_type": "SAFE_ZONE",
        "worker_auth_status": "FULL_CLEARANCE",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "distance_from_permitted_zone_boundary": 0.4,
        "entry_time": "2026-09-24 09:15:00",
        "duration_inside_zone": 300,
        "rfid_detection_status": "DETECTED_VALID",
        "uwb_location_info": "PRECISION_HIGH",
        "gps_location": "LOCK_3D",
        "previous_zone_entry_history": 0,
        "entry_exit_status": "ENTRY",
        "restricted_zone_indicator": 0
    }
    
    # Sample Test IoT Payload 2: Unauthorized Boundary Intrusion
    unsafe_event = {
        "worker_id": "WRK-1045",
        "zone_id": "ZONE-C-HAZARD-CHEM",
        "zone_type": "CHEMICAL_HAZARD",
        "worker_auth_status": "REVOKED",
        "latitude": 37.7768,
        "longitude": -122.4172,
        "distance_from_permitted_zone_boundary": 14.8,
        "entry_time": "2026-09-24 14:22:00",
        "duration_inside_zone": 2100,
        "rfid_detection_status": "SIGNAL_SPOOFED",
        "uwb_location_info": "DRIFT_HIGH",
        "gps_location": "DEGRADED",
        "previous_zone_entry_history": 4,
        "entry_exit_status": "ENTRY",
        "restricted_zone_indicator": 1
    }
    
    print("Predicting Safe Event:")
    print(predictor.predict(safe_event))
    print("\nPredicting Unsafe Event:")
    print(predictor.predict(unsafe_event))
