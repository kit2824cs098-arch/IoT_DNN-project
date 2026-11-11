import React from 'react';
import { Cpu, Database, Network, ShieldAlert, ArrowRight, Zap, Layers, Server } from 'lucide-react';

export default function ArchitectureDiagram() {
  return (
    <div className="glass-card">
      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>IoT & Deep Learning Architecture Overview</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Decoupled system architecture isolating the Hardware Sensing Layer, DNN Preprocessing & Classification Layer, and Supervisor Alerting Engine.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 16, alignItems: 'center' }}>
        {/* Layer 1: IoT Sensing Layer */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 14, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Cpu color="var(--primary-cyan)" size={24} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-cyan)' }}>1. IoT Edge Sensing</h4>
          </div>
          <ul style={{ listStyle: 'none', fontSize: 13, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>● <strong>Microcontroller:</strong> ESP32 Edge Processor</li>
            <li>● <strong>Credentials:</strong> RFID Worker Badge Transponder</li>
            <li>● <strong>Positioning:</strong> Ultra-Wideband (UWB) Spatial Fix</li>
            <li>● <strong>Coordinates:</strong> 3D GPS Latitude / Longitude</li>
            <li>● <strong>Output:</strong> Sensor Payload JSON Stream</li>
          </ul>
        </div>

        <ArrowRight size={24} color="var(--primary-cyan)" style={{ opacity: 0.6 }} />

        {/* Layer 2: DNN Deep Learning Pipeline */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 14, border: '1px solid var(--border-active)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Layers color="var(--primary-blue)" size={24} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-blue)' }}>2. Preprocessing & PyTorch MLP</h4>
          </div>
          <ul style={{ listStyle: 'none', fontSize: 13, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>● <strong>Feature Engine:</strong> Spatial Boundary & Drift Delta</li>
            <li>● <strong>Encoder & Scaler:</strong> One-Hot + StandardScaler</li>
            <li>● <strong>Architecture:</strong> Configurable Dense + ReLU + Dropout</li>
            <li>● <strong>Optimizer:</strong> Adam with BCE Loss Function</li>
            <li>● <strong>Inference Output:</strong> Risk Score (0-100) + Confidence</li>
          </ul>
        </div>

        <ArrowRight size={24} color="var(--primary-blue)" style={{ opacity: 0.6 }} />

        {/* Layer 3: Alert & Dashboard Layer */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 14, border: '1px solid rgba(239,68,68,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ShieldAlert color="var(--danger-red)" size={24} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger-red)' }}>3. Alert & Supervisory</h4>
          </div>
          <ul style={{ listStyle: 'none', fontSize: 13, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>● <strong>Classification:</strong> SAFE vs UNAUTHORIZED</li>
            <li>● <strong>Decision Rule:</strong> Risk Score &gt;= Config Threshold</li>
            <li>● <strong>Supervisor Notice:</strong> Real-time Web Dashboard Alert</li>
            <li>● <strong>Local Actuator:</strong> ESP32 GPIO Hardware Buzzer</li>
            <li>● <strong>Explainability:</strong> Top Factor Attribution Report</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
