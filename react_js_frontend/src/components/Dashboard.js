import React, { useEffect, useState } from 'react';
import { fetchUpcomingDeadlines } from '../api';
import UploadContract from './UploadContract';
import './dashboard.css';
import './upload.css';

// PUBLIC_INTERFACE
/**
 * Dashboard shows upcoming deadlines pulled from the backend and provides an upload area.
 */
export default function Dashboard() {
  const [deadlines, setDeadlines] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | empty
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setStatus('loading');
      setError('');
      try {
        const data = await fetchUpcomingDeadlines(); // default 7 days window
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setDeadlines(data);
          setStatus('success');
        } else {
          setDeadlines([]);
          setStatus('empty');
        }
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Unknown error');
        setStatus('error');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container">
      <h2 className="title" style={{ color: '#111827' }}>Dashboard</h2>

      <UploadContract />

      <h3 className="title" style={{ marginTop: '1.5rem', color: '#111827' }}>Upcoming Deadlines</h3>
      {status === 'loading' && <p className="description">Loading deadlines…</p>}
      {status === 'error' && <p className="error">Failed to load deadlines: {error}</p>}
      {status === 'empty' && <p className="description">No upcoming deadlines in the next week.</p>}
      {status === 'success' && (
        <ul className="list">
          {deadlines.map((d, idx) => (
            <li key={`${d.contract_id}-${d.title}-${idx}`} className="list-item">
              <div className="list-main">
                <span className="item-title">{d.title}</span>
                <span className="item-sub">Contract: {d.contract_id}</span>
              </div>
              <div className="list-meta">
                <span className="badge">{new Date(d.due_date).toLocaleString()}</span>
              </div>
              {d.note ? <div className="item-note">{d.note}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
