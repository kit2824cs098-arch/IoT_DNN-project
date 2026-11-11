import React, { useEffect, useState } from 'react';
import { BarChart2, Layers, CheckSquare, Target, Activity, RefreshCw } from 'lucide-react';

export default function ModelMetrics({ apiHost }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('MLP_DNN');
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiHost}/api/model-metrics`);
      if (!res.ok) throw new Error('Failed to fetch model metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [apiHost]);

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: 50 }}>
        <Activity className="animate-spin" size={32} color="var(--primary-cyan)" />
        <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>Fetching DNN & Baseline Evaluation Metrics...</div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="glass-card" style={{ padding: 30, textAlign: 'center' }}>
        <div style={{ color: 'var(--danger-red)', marginBottom: 12 }}>Error: {error || 'No metrics found'}</div>
        <button className="btn btn-secondary" onClick={fetchMetrics}>
          <RefreshCw size={14} /> Retry Loading
        </button>
      </div>
    );
  }

  const modelKeys = Object.keys(metrics);
  const currentMetrics = metrics[selectedModel];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Model Switcher & Cards */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800 }}>Model Performance Benchmarking</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Empirical test set metrics calculated on 600 held-out IoT zone entry events.
            </p>
          </div>
          <div className="nav-tabs">
            {modelKeys.map((key) => (
              <button
                key={key}
                className={`nav-tab ${selectedModel === key ? 'active' : ''}`}
                onClick={() => setSelectedModel(key)}
              >
                {key === 'MLP_DNN' ? 'PyTorch MLP (Primary)' : key}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Metric Cards for Selected Model */}
        <div className="grid-4">
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>ACCURACY</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary-cyan)', marginTop: 4 }}>
              {(currentMetrics.accuracy * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Overall Classification Accuracy</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>PRECISION</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary-blue)', marginTop: 4 }}>
              {(currentMetrics.precision * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Unauthorized True Positive Precision</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>RECALL / SENSITIVITY</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--warning-amber)', marginTop: 4 }}>
              {(currentMetrics.recall * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Breach Detection Recall Rate</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>F1-SCORE</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--safe-green)', marginTop: 4 }}>
              {(currentMetrics.f1_score * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Harmonic Precision-Recall Mean</div>
          </div>
        </div>
      </div>

      {/* Model Comparison Table & Confusion Matrix */}
      <div className="grid-2">
        {/* Comparative Table */}
        <div className="glass-card">
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>MLP vs XGBoost vs TabPFN Comparison</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
                <th>ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {modelKeys.map((key) => {
                const item = metrics[key];
                const isPrimary = key === 'MLP_DNN';
                return (
                  <tr key={key} style={{ fontWeight: isPrimary ? 700 : 400, background: isPrimary ? 'rgba(0, 229, 255, 0.05)' : 'transparent' }}>
                    <td style={{ color: isPrimary ? 'var(--primary-cyan)' : 'var(--text-main)' }}>
                      {key} {isPrimary && '(Primary)'}
                    </td>
                    <td>{(item.accuracy * 100).toFixed(1)}%</td>
                    <td>{(item.precision * 100).toFixed(1)}%</td>
                    <td>{(item.recall * 100).toFixed(1)}%</td>
                    <td>{(item.f1_score * 100).toFixed(1)}%</td>
                    <td>{item.roc_auc.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Confusion Matrix Visualization */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ fontSize: 16, fontWeight: 700 }}>Confusion Matrix ({selectedModel})</h4>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>N = {currentMetrics.test_sample_count} Samples</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '12px 0' }}>
            <div className="cm-cell cm-cell-tn">
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>True Negatives (TN)</div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>
                {currentMetrics.confusion_matrix[0][0]}
              </div>
              <div style={{ fontSize: 11 }}>Correctly Identified SAFE</div>
            </div>

            <div className="cm-cell cm-cell-fp">
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>False Positives (FP)</div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>
                {currentMetrics.confusion_matrix[0][1]}
              </div>
              <div style={{ fontSize: 11 }}>False Intrusion Alarm</div>
            </div>

            <div className="cm-cell cm-cell-fn">
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>False Negatives (FN)</div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>
                {currentMetrics.confusion_matrix[1][0]}
              </div>
              <div style={{ fontSize: 11 }}>Missed Security Breach</div>
            </div>

            <div className="cm-cell cm-cell-tp">
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>True Positives (TP)</div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>
                {currentMetrics.confusion_matrix[1][1]}
              </div>
              <div style={{ fontSize: 11 }}>Correct UNAUTHORIZED Alert</div>
            </div>
          </div>
        </div>
      </div>

      {/* SVG ROC Curve Overlay Plot */}
      <div className="glass-card">
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>ROC Curve (Receiver Operating Characteristic)</h4>
        <div style={{ width: '100%', height: 220, position: 'relative', background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 16 }}>
          <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="none">
            {/* Gridlines */}
            <line x1="0" y1="180" x2="500" y2="0" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
            <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" />
            <line x1="250" y1="0" x2="250" y2="180" stroke="rgba(255,255,255,0.05)" />

            {/* Render ROC Curve line for each model */}
            {modelKeys.map((mKey, idx) => {
              const points = metrics[mKey].roc_curve || [];
              const svgPoints = points.map(p => `${p.fpr * 500},${180 - (p.tpr * 180)}`).join(' ');
              const strokeColor = mKey === 'MLP_DNN' ? '#00e5ff' : mKey === 'XGBoost' ? '#3b82f6' : '#8b5cf6';
              return (
                <polyline
                  key={mKey}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={mKey === selectedModel ? 3.5 : 2}
                  strokeOpacity={mKey === selectedModel ? 1.0 : 0.4}
                  points={svgPoints}
                />
              );
            })}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, fontSize: 12 }}>
            <span style={{ color: '#00e5ff', display: 'flex', alignItems: 'center', gap: 6 }}>
              ● MLP DNN (AUC = {metrics.MLP_DNN?.roc_auc})
            </span>
            <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
              ● XGBoost (AUC = {metrics.XGBoost?.roc_auc})
            </span>
            <span style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 6 }}>
              ● TabPFN (AUC = {metrics.TabPFN?.roc_auc})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
