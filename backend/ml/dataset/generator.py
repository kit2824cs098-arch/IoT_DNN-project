import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_data(num_samples=3000, seed=42):
    """
    Generates a realistic synthetic IoT dataset for Worker Safety Zone Monitoring.
    
    Features included:
    - worker_id: Categorical ID string
    - zone_id: Categorical Zone identifier
    - zone_type: Type of zone (Assembly, General Work, Chemical Hazard, High Voltage, Restricted Storage)
    - worker_auth_status: Clearance level (Full Clearance, Operator Level, Maintenance Tech, Visitor, Revoked)
    - latitude: Worker latitude position
    - longitude: Worker longitude position
    - distance_from_permitted_zone_boundary: Distance outside safe perimeter (meters)
    - entry_time: ISO timestamp string
    - entry_hour: Hour of entry (0-23)
    - duration_inside_zone: Time spent inside zone (seconds)
    - rfid_detection_status: RFID sensor reading (DETECTED_VALID, DETECTED_INVALID, NOT_DETECTED, SIGNAL_SPOOFED)
    - uwb_location_info: UWB precision state (PRECISION_HIGH, DRIFT_LOW, DRIFT_HIGH, UNRELIABLE)
    - gps_location: GPS fix quality (LOCK_3D, LOCK_2D, DEGRADED, NO_FIX)
    - previous_zone_entry_history: Historical safety violation count (0-15)
    - entry_exit_status: Event type (ENTRY, INSIDE_MONITORING, EXIT)
    - restricted_zone_indicator: Flag for high-security restricted area (0 or 1)
    
    Target:
    - is_unauthorized: 0 for SAFE / AUTHORIZED, 1 for UNAUTHORIZED / UNSAFE
    """
    np.random.seed(seed)
    random.seed(seed)

    worker_ids = [f"WRK-{1000 + i}" for i in range(1, 51)]
    
    # Worker base clearance levels
    worker_clearance_map = {}
    for wid in worker_ids:
        worker_clearance_map[wid] = random.choice([
            "FULL_CLEARANCE", "OPERATOR_LEVEL", "MAINTENANCE_TECH", "VISITOR", "REVOKED"
        ])

    zones = [
        {"id": "ZONE-A-ASSEMBLY", "type": "SAFE_ZONE", "restricted": 0, "base_lat": 37.7749, "base_lon": -122.4194},
        {"id": "ZONE-B-STORAGE", "type": "CAUTION_ZONE", "restricted": 0, "base_lat": 37.7758, "base_lon": -122.4182},
        {"id": "ZONE-C-HAZARD-CHEM", "type": "CHEMICAL_HAZARD", "restricted": 1, "base_lat": 37.7765, "base_lon": -122.4170},
        {"id": "ZONE-D-HIGH-VOLT", "type": "HIGH_VOLTAGE", "restricted": 1, "base_lat": 37.7772, "base_lon": -122.4160},
        {"id": "ZONE-E-EXCLUSION", "type": "CRITICAL_EXCLUSION", "restricted": 1, "base_lat": 37.7780, "base_lon": -122.4150},
    ]

    rfid_statuses = ["DETECTED_VALID", "DETECTED_INVALID", "NOT_DETECTED", "SIGNAL_SPOOFED"]
    uwb_statuses = ["PRECISION_HIGH", "DRIFT_LOW", "DRIFT_HIGH", "UNRELIABLE"]
    gps_statuses = ["LOCK_3D", "LOCK_2D", "DEGRADED", "NO_FIX"]
    entry_exit_options = ["ENTRY", "INSIDE_MONITORING", "EXIT"]

    records = []
    base_time = datetime(2026, 9, 24, 6, 0, 0)

    for i in range(num_samples):
        worker = random.choice(worker_ids)
        auth_status = worker_clearance_map[worker]
        zone = random.choice(zones)

        # Time simulation
        event_time = base_time + timedelta(minutes=random.randint(0, 1440), seconds=random.randint(0, 59))
        entry_hour = event_time.hour

        # Distance logic & violation probability calculation
        is_restricted = zone["restricted"]
        
        # Determine baseline violation tendency
        unauthorized_score = 0.0
        
        if auth_status in ["REVOKED", "VISITOR"] and is_restricted:
            unauthorized_score += 0.65
        elif auth_status == "OPERATOR_LEVEL" and zone["type"] in ["CRITICAL_EXCLUSION", "HIGH_VOLTAGE"]:
            unauthorized_score += 0.45
        elif auth_status == "FULL_CLEARANCE":
            unauthorized_score -= 0.30

        # RFID status influence
        rfid_status = random.choices(
            rfid_statuses,
            weights=[0.65, 0.15, 0.12, 0.08] if auth_status != "REVOKED" else [0.10, 0.50, 0.20, 0.20]
        )[0]
        
        if rfid_status in ["DETECTED_INVALID", "SIGNAL_SPOOFED"]:
            unauthorized_score += 0.35
        elif rfid_status == "NOT_DETECTED":
            unauthorized_score += 0.20
        elif rfid_status == "DETECTED_VALID":
            unauthorized_score -= 0.25

        # Distance outside safe boundary
        if is_restricted:
            if unauthorized_score > 0.2:
                boundary_distance = np.random.exponential(scale=12.0) + 3.0
            else:
                boundary_distance = max(0.0, np.random.normal(loc=1.2, scale=1.5))
        else:
            boundary_distance = max(0.0, np.random.normal(loc=0.5, scale=0.8))

        if boundary_distance > 5.0:
            unauthorized_score += min(0.40, (boundary_distance - 5.0) * 0.03)

        # Duration inside zone
        duration = random.randint(15, 7200) # 15s to 2 hours
        if is_restricted and duration > 1800 and auth_status != "FULL_CLEARANCE":
            unauthorized_score += 0.25

        # Historical violations
        prev_violations = np.random.poisson(lam=1.2 if auth_status in ["REVOKED", "VISITOR"] else 0.4)
        if prev_violations >= 3:
            unauthorized_score += 0.20

        # Sensor fix qualities
        uwb_info = random.choices(uwb_statuses, weights=[0.6, 0.2, 0.1, 0.1])[0]
        gps_fix = random.choices(gps_statuses, weights=[0.5, 0.3, 0.1, 0.1])[0]
        
        if uwb_info in ["DRIFT_HIGH", "UNRELIABLE"] or gps_fix in ["DEGRADED", "NO_FIX"]:
            unauthorized_score += 0.10 # Uncertainty factor

        # GPS coordinates
        lat_offset = (boundary_distance / 111000.0) * np.random.choice([-1, 1])
        lon_offset = (boundary_distance / (111000.0 * np.cos(np.radians(zone["base_lat"])))) * np.random.choice([-1, 1])
        lat = round(zone["base_lat"] + lat_offset, 6)
        lon = round(zone["base_lon"] + lon_offset, 6)

        entry_exit = random.choice(entry_exit_options)

        # Final label determination with sigmoid probability + noise for realistic dataset
        prob = 1.0 / (1.0 + np.exp(-3.5 * (unauthorized_score - 0.25)))
        target_label = 1 if (prob > 0.5 and random.random() < 0.92) or (random.random() < 0.04) else 0

        records.append({
            "worker_id": worker,
            "zone_id": zone["id"],
            "zone_type": zone["type"],
            "worker_auth_status": auth_status,
            "latitude": lat,
            "longitude": lon,
            "distance_from_permitted_zone_boundary": round(float(boundary_distance), 2),
            "entry_time": event_time.strftime("%Y-%m-%d %H:%M:%S"),
            "entry_hour": entry_hour,
            "duration_inside_zone": duration,
            "rfid_detection_status": rfid_status,
            "uwb_location_info": uwb_info,
            "gps_location": gps_fix,
            "previous_zone_entry_history": int(prev_violations),
            "entry_exit_status": entry_exit,
            "restricted_zone_indicator": is_restricted,
            "is_unauthorized": int(target_label)
        })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "synthetic_zone_events.csv")
    
    df = generate_synthetic_data(num_samples=3000)
    df.to_csv(csv_path, index=False)
    print(f"Generated synthetic dataset with {len(df)} samples saved to: {csv_path}")
    print("Class distribution:")
    print(df["is_unauthorized"].value_counts(normalize=True))
