import React, { useState } from 'react';
import { Cpu, ShieldCheck, BarChart3, Bell, Layers, Radio } from 'lucide-react';
import DNNPrediction from './components/DNNPrediction';
import ModelMetrics from './components/ModelMetrics';
import AlertPanel from './components/AlertPanel';
import ArchitectureDiagram from './components/ArchitectureDiagram';

const API_HOST = 'http://localhost:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('prediction');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">
            <Cpu size={22} />
          </div>
          <div>
            <div className="brand-title">IoT Worker Safety Zone Monitoring</div>
            <div className="brand-subtitle">Deep Neural Network (DNN) Safety Engine</div>
          </div>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'prediction' ? 'active' : ''}`}
            onClick={() => setActiveTab('prediction')}
          >
            <ShieldCheck size={16} /> Live DNN Predictor
          </button>
          <button
            className={`nav-tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={16} /> Intrusion Alert Feed
          </button>
          <button
            className={`nav-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <BarChart3 size={16} /> Model Comparison
          </button>
          <button
            className={`nav-tab ${activeTab === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveTab('architecture')}
          >
            <Layers size={16} /> Architecture
          </button>
        </div>
      </nav>

      {/* Main Workspace Content */}
      <main className="container" style={{ flex: 1 }}>
        {activeTab === 'prediction' && <DNNPrediction apiHost={API_HOST} />}
        {activeTab === 'alerts' && <AlertPanel apiHost={API_HOST} />}
        {activeTab === 'metrics' && <ModelMetrics apiHost={API_HOST} />}
        {activeTab === 'architecture' && <ArchitectureDiagram />}
      </main>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '20px', 
        borderTop: '1px solid var(--border-color)', 
        fontSize: 12, 
        color: 'var(--text-dim)',
        marginTop: 40 
      }}>
        IoT-Based Worker Safety Zone Monitoring System &bull; Powered by PyTorch Multi-Layer Perceptron (MLP) &bull; 2026 Academic Project
      </footer>
    </div>
  );
}
