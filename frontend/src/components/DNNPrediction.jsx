import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Cpu, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';

export default function DNNPrediction({ apiHost }) {
  // Input IoT Event State
  const [formData, setFormData] = useState({
    worker_id: 'WRK-1042',
    zone_id: 'ZONE-C-HAZARD-CHEM',
    zone_type: 'CHEMICAL_HAZARD',
    worker_auth_status: 'REVOKED',
    latitude: 37.7765,
    longitude: -122.4170,
    distance_from_permitted_zone_boundary: 12.5,
    entry_time: '2026-09-24 14:30:00',
    duration_inside_zone: 1850,
    rfid_detection_status: 'SIGNAL_SPOOFED',
    uwb_location_info: 'DRIFT_HIGH',
    gps_location: 'DEGRADED',
    previous_zone_entry_history: 3,
    entry_exit_status: 'ENTRY',
    restricted_zone_indicator: 1,
    threshold: 0.50
  });

  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const applyPreset = (presetType) => {
    if (presetType === 'safe') {
      setFormData({
        worker_id: 'WRK-1012',
        zone_id: 'ZONE-A-ASSEMBLY',
        zone_type: 'SAFE_ZONE',
        worker_auth_status: 'FULL_CLEARANCE',
        latitude: 37.7749,
        longitude: -122.4194,
        distance_from_permitted_zone_boundary: 0.4,
        entry_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        duration_inside_zone: 300,
        rfid_detection_status: 'DETECTED_VALID',
        uwb_location_info: 'PRECISION_HIGH',
        gps_location: 'LOCK_3D',
        previous_zone_entry_history: 0,
        entry_exit_status: 'ENTRY',
        restricted_zone_indicator: 0,
        threshold: 0.50
      });
    } else if (presetType === 'boundary_breach') {
      setFormData({
        worker_id: 'WRK-1025',
        zone_id: 'ZONE-D-HIGH-VOLT',
        zone_type: 'HIGH_VOLTAGE',
        worker_auth_status: 'OPERATOR_LEVEL',
        latitude: 37.7775,
        longitude: -122.4162,
        distance_from_permitted_zone_boundary: 18.2,
        entry_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        duration_inside_zone: 900,
        rfid_detection_status: 'DETECTED_VALID',
        uwb_location_info: 'DRIFT_LOW',
        gps_location: 'LOCK_2D',
        previous_zone_entry_history: 1,
        entry_exit_status: 'ENTRY',
        restricted_zone_indicator: 1,
        threshold: 0.50
      });
    } else if (presetType === 'rfid_spoof') {
      setFormData({
        worker_id: 'WRK-1049',
        zone_id: 'ZONE-E-EXCLUSION',
        zone_type: 'CRITICAL_EXCLUSION',
        worker_auth_status: 'VISITOR',
        latitude: 37.7782,
        longitude: -122.4151,
        distance_from_permitted_zone_boundary: 9.6,
        entry_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        duration_inside_zone: 2400,
        rfid_detection_status: 'SIGNAL_SPOOFED',
        uwb_location_info: 'UNRELIABLE',
        gps_location: 'NO_FIX',
        previous_zone_entry_history: 5,
        entry_exit_status: 'ENTRY',
        restricted_zone_indicator: 1,
        threshold: 0.50
      });
    }
  };

  const executePrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiHost}/api/predict-zone-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      setPredictionResult(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to DNN API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-2">
      {/* Left Column: Input IoT Payload Configurator */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={22} color="var(--primary-cyan)" />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>IoT Event Input Configurator</h3>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => applyPreset('safe')}>
              Safe Preset
            </button>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => applyPreset('boundary_breach')}>
              Breach Preset
            </button>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => applyPreset('rfid_spoof')}>
              Spoof Preset
            </button>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Worker ID</label>
            <input className="form-input" name="worker_id" value={formData.worker_id} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Worker Auth Status</label>
            <select className="form-select" name="worker_auth_status" value={formData.worker_auth_status} onChange={handleInputChange}>
              <option value="FULL_CLEARANCE">FULL_CLEARANCE</option>
              <option value="OPERATOR_LEVEL">OPERATOR_LEVEL</option>
              <option value="MAINTENANCE_TECH">MAINTENANCE_TECH</option>
              <option value="VISITOR">VISITOR</option>
              <option value="REVOKED">REVOKED</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Zone ID</label>
            <input className="form-input" name="zone_id" value={formData.zone_id} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Zone Type</label>
            <select className="form-select" name="zone_type" value={formData.zone_type} onChange={handleInputChange}>
              <option value="SAFE_ZONE">SAFE_ZONE</option>
              <option value="CAUTION_ZONE">CAUTION_ZONE</option>
              <option value="CHEMICAL_HAZARD">CHEMICAL_HAZARD</option>
              <option value="HIGH_VOLTAGE">HIGH_VOLTAGE</option>
              <option value="CRITICAL_EXCLUSION">CRITICAL_EXCLUSION</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Boundary Distance (Meters)</label>
            <input className="form-input" type="number" step="0.1" name="distance_from_permitted_zone_boundary" value={formData.distance_from_permitted_zone_boundary} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Duration Inside Zone (Sec)</label>
            <input className="form-input" type="number" name="duration_inside_zone" value={formData.duration_inside_zone} onChange={handleInputChange} />
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">RFID Sensor State</label>
            <select className="form-select" name="rfid_detection_status" value={formData.rfid_detection_status} onChange={handleInputChange}>
              <option value="DETECTED_VALID">DETECTED_VALID</option>
              <option value="DETECTED_INVALID">DETECTED_INVALID</option>
              <option value="NOT_DETECTED">NOT_DETECTED</option>
              <option value="SIGNAL_SPOOFED">SIGNAL_SPOOFED</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">UWB Fix Precision</label>
            <select className="form-select" name="uwb_location_info" value={formData.uwb_location_info} onChange={handleInputChange}>
              <option value="PRECISION_HIGH">PRECISION_HIGH</option>
              <option value="DRIFT_LOW">DRIFT_LOW</option>
              <option value="DRIFT_HIGH">DRIFT_HIGH</option>
              <option value="UNRELIABLE">UNRELIABLE</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">GPS Fix Quality</label>
            <select className="form-select" name="gps_location" value={formData.gps_location} onChange={handleInputChange}>
              <option value="LOCK_3D">LOCK_3D</option>
              <option value="LOCK_2D">LOCK_2D</option>
              <option value="DEGRADED">DEGRADED</option>
              <option value="NO_FIX">NO_FIX</option>
            </select>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 8 }}>
          <div className="form-group">
            <label className="form-label">Previous Violations Count</label>
            <input className="form-input" type="number" name="previous_zone_entry_history" value={formData.previous_zone_entry_history} onChange={handleInputChange} />
          </div>
          <div className="form-group" style={{ justifyContent: 'center' }}>
            <label className="form-label">Restricted Area Flag</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" name="restricted_zone_indicator" checked={formData.restricted_zone_indicator === 1} onChange={handleInputChange} style={{ width: 18, height: 18 }} />
              High Security Restricted Zone
            </label>
          </div>
        </div>

        {/* Risk Threshold Slider */}
        <div className="form-group" style={{ marginTop: 14, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="form-label">Configurable Alert Decision Threshold:</span>
            <span style={{ color: 'var(--primary-cyan)', fontWeight: 700 }}>{(formData.threshold * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0.10" 
            max="0.90" 
            step="0.05" 
            name="threshold" 
            value={formData.threshold} 
            onChange={handleInputChange}
            style={{ width: '100%', marginTop: 8, accentColor: 'var(--primary-cyan)' }}
          />
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: 18, padding: '14px 20px', fontSize: 15 }} 
          onClick={executePrediction}
          disabled={loading}
        >
          {loading ? <Activity className="animate-spin" size={18} /> : <Play size={18} />}
          {loading ? 'Evaluating DNN Pipeline...' : 'Run PyTorch DNN Prediction'}
        </button>

        {error && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: 'var(--danger-red)', fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>

      {/* Right Column: Prediction Results & Explainability */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Real-time Classification Result Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)' }}>DNN Classifier Output</h3>
            {predictionResult && (
              <span className={`badge ${predictionResult.prediction === 'SAFE' ? 'badge-safe' : 'badge-danger'}`}>
                {predictionResult.prediction === 'SAFE' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                {predictionResult.prediction}
              </span>
            )}
          </div>

          {predictionResult ? (
            <div>
              {/* Risk Gauge and Confidence Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 12, textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Risk Score</div>
                  <div style={{ 
                    fontSize: 42, 
                    fontWeight: 800, 
                    color: predictionResult.risk_score > 50 ? 'var(--danger-red)' : 'var(--safe-green)',
                    margin: '6px 0' 
                  }}>
                    {predictionResult.risk_score}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Probability of Unauthorized Entry</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 12, textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Model Confidence</div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--primary-cyan)', margin: '6px 0' }}>
                    {(predictionResult.confidence * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Certainty Score</div>
                </div>
              </div>

              {/* Alert Required Status */}
              <div style={{ 
                padding: 14, 
                borderRadius: 10, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: predictionResult.alert_required ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${predictionResult.alert_required ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {predictionResult.alert_required ? (
                    <AlertTriangle color="var(--danger-red)" size={22} />
                  ) : (
                    <CheckCircle2 color="var(--safe-green)" size={22} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {predictionResult.alert_required ? 'Supervisor Alert Triggered!' : 'Authorized Zone Access'}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {predictionResult.alert_required ? 'ESP32 Hardware Buzzer Signal ACTIVE' : 'Normal worker activity confirmed'}
                    </div>
                  </div>
                </div>

                <span className={predictionResult.alert_required ? 'buzzer-indicator buzzer-on' : 'buzzer-indicator buzzer-off'}>
                  <Zap size={14} />
                  {predictionResult.alert_required ? 'BUZZER HIGH' : 'BUZZER OFF'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Cpu size={42} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>Fill out IoT sensor fields and click <strong>Run PyTorch DNN Prediction</strong></div>
            </div>
          )}
        </div>

        {/* Feature Explainability Inspector */}
        <div className="glass-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-main)' }}>
            Model Explainability & Feature Contribution
          </h3>

          {predictionResult && predictionResult.explainability ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {predictionResult.explainability.top_factors.map((factor, idx) => (
                <div key={idx} style={{ 
                  padding: 12, 
                  borderRadius: 8, 
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: `4px solid ${
                    factor.weight === 'HIGH' ? 'var(--danger-red)' :
                    factor.weight === 'MEDIUM' ? 'var(--warning-amber)' : 'var(--safe-green)'
                  }`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>{factor.feature}</span>
                    <span style={{ 
                      color: factor.weight === 'HIGH' ? 'var(--danger-red)' : 
                             factor.weight === 'MEDIUM' ? 'var(--warning-amber)' : 'var(--safe-green)'
                    }}>
                      {factor.weight} IMPACT
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-main)' }}>
                    {factor.impact}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>
              No prediction generated yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
