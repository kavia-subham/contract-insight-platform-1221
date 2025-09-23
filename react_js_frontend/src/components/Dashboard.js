import React, { useEffect, useMemo, useState } from 'react';
import { fetchUpcomingDeadlines } from '../api';
import UploadContract from './UploadContract';
import './dashboard.css';
import './upload.css';

/**
 * Local mock of contracts list until backend /contracts listing is wired to UI.
 * Replace with a real fetch to /contracts when ready.
 */
const MOCK_CONTRACTS = [
  {
    contract_id: 'C-001',
    filename: 'NDA_Acorn.pdf',
    uploader: 'alex@acme.com',
    uploaded_at: '2024-10-03T10:30:00Z',
    risk_level: 'medium',
    has_insights: true,
  },
  {
    contract_id: 'C-002',
    filename: 'MSA_BridgeLLC.pdf',
    uploader: 'sam@acme.com',
    uploaded_at: '2024-10-12T15:20:00Z',
    risk_level: 'high',
    has_insights: true,
  },
  {
    contract_id: 'C-003',
    filename: 'SOW_VendorX.pdf',
    uploader: 'alex@acme.com',
    uploaded_at: '2024-09-20T08:15:00Z',
    risk_level: 'low',
    has_insights: false,
  },
];

// PUBLIC_INTERFACE
/**
 * Dashboard shows upload area, filters/search for contracts, and upcoming deadlines.
 */
export default function Dashboard() {
  const [deadlines, setDeadlines] = useState([]);
  const [status, setStatus] = useState('idle'); // deadlines status: idle | loading | success | error | empty
  const [error, setError] = useState('');

  // Filters state
  const [textQuery, setTextQuery] = useState('');
  const [risk, setRisk] = useState('any'); // any|low|medium|high
  const [uploader, setUploader] = useState('any');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Contracts (mocked)
  const [contracts] = useState(MOCK_CONTRACTS);

  // Build uploader options
  const uploaderOptions = useMemo(() => {
    const s = new Set(contracts.map(c => c.uploader).filter(Boolean));
    return Array.from(s).sort();
  }, [contracts]);

  // Derived filtered contracts
  const filteredContracts = useMemo(() => {
    const q = textQuery.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTime = dateTo ? new Date(dateTo).getTime() : null;

    return contracts.filter(c => {
      // text filter on filename or id
      if (q) {
        const hay = `${c.filename} ${c.contract_id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // risk
      if (risk !== 'any' && c.risk_level !== risk) return false;
      // uploader
      if (uploader !== 'any' && c.uploader !== uploader) return false;
      // date range
      const ts = c.uploaded_at ? new Date(c.uploaded_at).getTime() : 0;
      if (fromTime && ts < fromTime) return false;
      if (toTime && ts > toTime + 24 * 60 * 60 * 1000 - 1) return false; // inclusive end of day
      return true;
    });
  }, [contracts, textQuery, risk, uploader, dateFrom, dateTo]);

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

  function viewContract(contractId) {
    window.location.hash = `#/contract?contractId=${encodeURIComponent(contractId)}`;
  }

  return (
    <div className="container">
      <h2 className="title" style={{ color: '#111827' }}>Dashboard</h2>

      <UploadContract />

      {/* Filters/Search */}
      <section className="filters-card" aria-label="Contract Filters">
        <h3 className="title" style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Contracts</h3>
        <div className="filters-grid">
          <div className="filter-item">
            <label className="filter-label" htmlFor="q">Search</label>
            <input
              id="q"
              className="filter-input"
              type="text"
              placeholder="Search by filename or ID"
              value={textQuery}
              onChange={e => setTextQuery(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label className="filter-label" htmlFor="risk">Risk</label>
            <select id="risk" className="filter-select" value={risk} onChange={e => setRisk(e.target.value)}>
              <option value="any">Any</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label" htmlFor="uploader">Uploader</label>
            <select id="uploader" className="filter-select" value={uploader} onChange={e => setUploader(e.target.value)}>
              <option value="any">Any</option>
              {uploaderOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label" htmlFor="from">From</label>
            <input id="from" className="filter-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="filter-item">
            <label className="filter-label" htmlFor="to">To</label>
            <input id="to" className="filter-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="contracts-list">
          {filteredContracts.length === 0 && (
            <div className="empty-state">No contracts match the current filters.</div>
          )}
          {filteredContracts.map(c => (
            <div key={c.contract_id} className="contract-card">
              <div className="contract-row">
                <div className="contract-main">
                  <div className="contract-title">{c.filename}</div>
                  <div className="contract-sub">
                    <span className="muted">ID:</span> {c.contract_id}
                    <span className="dot" />
                    <span className="muted">Uploader:</span> {c.uploader}
                    <span className="dot" />
                    <span className={`risk-pill ${c.risk_level}`}>{c.risk_level}</span>
                  </div>
                </div>
                <div className="contract-meta">
                  <span className="badge">{new Date(c.uploaded_at).toLocaleDateString()}</span>
                  <button className="btn-view" onClick={() => viewContract(c.contract_id)}>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

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
