import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Zap, Radio, RefreshCw, Play, Filter } from 'lucide-react';

export default function AlertPanel({ apiHost }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSimulation = async (simType = 'unsafe') => {
    setSimulating(true);
    try {
      const res = await fetch(`${apiHost}/api/simulate-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: simType })
      });
      if (res.ok) {
        await fetchEvents();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 4000);
    return () => clearInterval(interval);
  }, [apiHost]);

  const filteredEvents = events.filter(e => {
    if (filter === 'UNAUTHORIZED') return e.prediction === 'UNAUTHORIZED';
    if (filter === 'SAFE') return e.prediction === 'SAFE';
    return true;
  });

  const latestAlert = events.find(e => e.prediction === 'UNAUTHORIZED');
  const isBuzzerActive = latestAlert && latestAlert.alert_required;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner: Active Buzzer State & Simulator */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className={isBuzzerActive ? 'buzzer-indicator buzzer-on' : 'buzzer-indicator buzzer-off'} style={{ padding: '12px 20px' }}>
            <Zap size={22} />
            <span style={{ fontSize: 16 }}>
              {isBuzzerActive ? 'ESP32 HARDWARE BUZZER: ALARM ACTIVE' : 'ESP32 HARDWARE BUZZER: IDLE'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {isBuzzerActive ? (
              <span style={{ color: 'var(--danger-red)', fontWeight: 600 }}>
                Intrusion breach detected for worker {latestAlert.worker_id} in {latestAlert.zone_id}!
              </span>
            ) : (
              'All safety zone monitoring parameters nominal.'
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-danger" 
            style={{ fontSize: 13 }}
            onClick={() => triggerSimulation('unsafe')}
            disabled={simulating}
          >
            <Play size={14} /> Simulate ESP32 Intrusion
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: 13 }}
            onClick={() => triggerSimulation('safe')}
            disabled={simulating}
          >
            <Play size={14} /> Simulate Safe Entry
          </button>
        </div>
      </div>

      {/* Events Log Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={20} color="var(--primary-cyan)" />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Real-Time Worker Zone Intrusion Stream</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={14} color="var(--text-muted)" />
            <div className="nav-tabs">
              <button className={`nav-tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
                All ({events.length})
              </button>
              <button className={`nav-tab ${filter === 'UNAUTHORIZED' ? 'active' : ''}`} onClick={() => setFilter('UNAUTHORIZED')}>
                Unauthorized ({events.filter(e => e.prediction === 'UNAUTHORIZED').length})
              </button>
              <button className={`nav-tab ${filter === 'SAFE' ? 'active' : ''}`} onClick={() => setFilter('SAFE')}>
                Safe ({events.filter(e => e.prediction === 'SAFE').length})
              </button>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={fetchEvents}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Worker ID</th>
                <th>Zone ID</th>
                <th>Safety Status</th>
                <th>Risk Score</th>
                <th>Confidence</th>
                <th>Alert / Buzzer</th>
                <th>Primary Contribution Factor</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt, idx) => {
                const isUnauth = evt.prediction === 'UNAUTHORIZED';
                const topFactor = evt.explainability?.top_factors?.[0]?.impact || 'Nominal clearance';
                return (
                  <tr key={idx} style={{ background: isUnauth ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{evt.timestamp}</td>
                    <td style={{ fontWeight: 700 }}>{evt.worker_id}</td>
                    <td>{evt.zone_id}</td>
                    <td>
                      <span className={`badge ${isUnauth ? 'badge-danger' : 'badge-safe'}`}>
                        {isUnauth ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                        {evt.prediction}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: isUnauth ? 'var(--danger-red)' : 'var(--safe-green)' }}>
                      {evt.risk_score}%
                    </td>
                    <td>{(evt.confidence * 100).toFixed(1)}%</td>
                    <td>
                      <span className={evt.alert_required ? 'buzzer-indicator buzzer-on' : 'buzzer-indicator buzzer-off'} style={{ padding: '2px 8px', fontSize: 11 }}>
                        {evt.alert_required ? 'BUZZER HIGH' : 'OFF'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-main)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {topFactor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No recent events logged yet. Use the simulation buttons above to trigger live IoT payloads.
          </div>
        )}
      </div>
    </div>
  );
}
