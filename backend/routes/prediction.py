from flask import Blueprint, request, jsonify
import os
import sys
import json
import random
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from ml.predict import WorkerSafetyPredictor

prediction_bp = Blueprint("prediction", __name__)

# Initialize single global predictor instance (no retraining per prediction)
try:
    predictor = WorkerSafetyPredictor()
    print("WorkerSafetyPredictor initialized successfully in API routes.")
except Exception as e:
    print(f"Warning: Could not initialize predictor on route import: {e}")
    predictor = None

# In-memory store for recent zone entry logs (last 50 events)
recent_events_log = []

@prediction_bp.route("/api/predict-zone-entry", methods=["POST"])
def predict_zone_entry():
    """
    API Endpoint: POST /api/predict-zone-entry
    Receives IoT sensor payload from ESP32 or Edge gateway, passes data to DNN pipeline,
    and returns safety prediction, risk score, confidence, and alert state.
    """
    global predictor, recent_events_log

    if not request.is_json:
        return jsonify({"error": "Invalid request format. JSON body expected."}), 400

    iot_payload = request.get_json()

    if predictor is None:
        try:
            predictor = WorkerSafetyPredictor()
        except Exception as e:
            return jsonify({"error": f"Model initialization error: {str(e)}"}), 500

    try:
        custom_threshold = iot_payload.get("threshold", 0.50)
        result = predictor.predict(iot_payload, custom_threshold=custom_threshold)
        
        # Append timestamp and log event
        event_record = {
            **result,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "raw_payload": iot_payload
        }
        
        recent_events_log.insert(0, event_record)
        if len(recent_events_log) > 50:
            recent_events_log.pop()

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@prediction_bp.route("/api/model-metrics", methods=["GET"])
def get_model_metrics():
    """
    API Endpoint: GET /api/model-metrics
    Returns evaluation metrics (Accuracy, Precision, Recall, F1, Confusion Matrix, ROC curves)
    comparing MLP DNN vs XGBoost vs TabPFN.
    """
    metrics_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "ml", "model_metrics.json"
    )

    if not os.path.exists(metrics_path):
        return jsonify({"error": "Model metrics not found. Train the model first."}), 444

    try:
        with open(metrics_path, "r") as f:
            metrics_data = json.load(f)
        return jsonify(metrics_data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to read model metrics: {str(e)}"}), 500


@prediction_bp.route("/api/events", methods=["GET"])
def get_recent_events():
    """
    API Endpoint: GET /api/events
    Returns recent IoT prediction logs for the dashboard stream.
    """
    return jsonify({
        "total_logged": len(recent_events_log),
        "events": recent_events_log
    }), 200


@prediction_bp.route("/api/simulate-event", methods=["POST"])
def simulate_event():
    """
    API Endpoint: POST /api/simulate-event
    Generates a random simulated IoT worker zone event (safe or unsafe edge-case)
    and executes prediction.
    """
    sim_type = request.json.get("type", "random") if request.is_json else "random"

    workers = ["WRK-1002", "WRK-1015", "WRK-1028", "WRK-1044"]
    zones = [
        {"id": "ZONE-A-ASSEMBLY", "type": "SAFE_ZONE", "restricted": 0},
        {"id": "ZONE-C-HAZARD-CHEM", "type": "CHEMICAL_HAZARD", "restricted": 1},
        {"id": "ZONE-D-HIGH-VOLT", "type": "HIGH_VOLTAGE", "restricted": 1}
    ]
    
    zone = random.choice(zones)
    
    if sim_type == "unsafe":
        auth_status = "REVOKED"
        distance = round(random.uniform(8.0, 22.0), 1)
        rfid = "SIGNAL_SPOOFED"
        uwb = "DRIFT_HIGH"
        gps = "DEGRADED"
        history = random.randint(3, 7)
    elif sim_type == "safe":
        auth_status = "FULL_CLEARANCE"
        distance = round(random.uniform(0.1, 1.2), 1)
        rfid = "DETECTED_VALID"
        uwb = "PRECISION_HIGH"
        gps = "LOCK_3D"
        history = 0
    else:
        auth_status = random.choice(["FULL_CLEARANCE", "OPERATOR_LEVEL", "VISITOR", "REVOKED"])
        distance = round(random.uniform(0.1, 15.0), 1)
        rfid = random.choice(["DETECTED_VALID", "DETECTED_INVALID", "NOT_DETECTED", "SIGNAL_SPOOFED"])
        uwb = random.choice(["PRECISION_HIGH", "DRIFT_LOW", "DRIFT_HIGH"])
        gps = random.choice(["LOCK_3D", "LOCK_2D", "DEGRADED"])
        history = random.randint(0, 4)

    sample_event = {
        "worker_id": random.choice(workers),
        "zone_id": zone["id"],
        "zone_type": zone["type"],
        "worker_auth_status": auth_status,
        "latitude": 37.7750,
        "longitude": -122.4180,
        "distance_from_permitted_zone_boundary": distance,
        "entry_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "duration_inside_zone": random.randint(30, 3600),
        "rfid_detection_status": rfid,
        "uwb_location_info": uwb,
        "gps_location": gps,
        "previous_zone_entry_history": history,
        "entry_exit_status": "ENTRY",
        "restricted_zone_indicator": zone["restricted"]
    }

    if predictor:
        res = predictor.predict(sample_event)
        event_record = {
            **res,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "raw_payload": sample_event
        }
        recent_events_log.insert(0, event_record)
        return jsonify(event_record), 200
    else:
        return jsonify({"error": "Predictor not loaded"}), 500
