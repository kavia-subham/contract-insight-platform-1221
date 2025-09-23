import React, { useEffect, useMemo, useState } from 'react';
import { fetchUpcomingDeadlines } from '../api';
import { fetchContracts } from '../apiContracts';
import UploadContract from './UploadContract';
import './dashboard.css';
import './upload.css';

// PUBLIC_INTERFACE
/**
 * Dashboard shows upload area, filters/search for contracts, and upcoming deadlines.
 * Contracts are fetched from the backend GET /contracts endpoint and filtered client-side.
 */
export default function Dashboard() {
  // Deadlines state
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesStatus, setDeadlinesStatus] = useState('idle'); // idle | loading | success | error | empty
  const [deadlinesError, setDeadlinesError] = useState('');

  // Contracts state
  const [contracts, setContracts] = useState([]);
  const [contractsStatus, setContractsStatus] = useState('idle'); // idle | loading | success | error | empty
  const [contractsError, setContractsError] = useState('');

  // Filters state (client-side)
  const [textQuery, setTextQuery] = useState('');
  const [risk, setRisk] = useState('any'); // any|low|medium|high
  const [uploader, setUploader] = useState('any');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch contracts on mount
  useEffect(() => {
    let mounted = true;
    async function loadContracts() {
      setContractsStatus('loading');
      setContractsError('');
      try {
        const data = await fetchContracts();
        if (!mounted) return;

        // Backend ContractSummary shape: { contract_id, filename, text_preview, has_insights }
        // Extend with derived fields for UI filters:
        const enriched = (Array.isArray(data) ? data : []).map((c) => {
          return {
            ...c,
            // uploader isn't in API spec; fall back to 'unknown' to keep UI consistent
            uploader: c.uploader || 'unknown',
            // uploaded_at also not in spec; since not available, use epoch 0 to avoid filtering them out,
            // or better, leave undefined and handle gracefully in filters.
            uploaded_at: c.uploaded_at || null,
            // derive risk_level from presence of insights and some simple heuristic on preview length
            risk_level: c.has_insights ? (c.text_preview && c.text_preview.length > 300 ? 'high' : 'medium') : 'low',
          };
        });

        setContracts(enriched);
        setContractsStatus(enriched.length ? 'success' : 'empty');
      } catch (e) {
        if (!mounted) return;
        setContractsError(e.message || 'Unknown error');
        setContractsStatus('error');
      }
    }
    loadContracts();
    return () => { mounted = false; };
  }, []);

  // Fetch deadlines on mount
  useEffect(() => {
    let mounted = true;
    async function loadDeadlines() {
      setDeadlinesStatus('loading');
      setDeadlinesError('');
      try {
        const data = await fetchUpcomingDeadlines();
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setDeadlines(data);
          setDeadlinesStatus('success');
        } else {
          setDeadlines([]);
          setDeadlinesStatus('empty');
        }
      } catch (e) {
        if (!mounted) return;
        setDeadlinesError(e.message || 'Unknown error');
        setDeadlinesStatus('error');
      }
    }
    loadDeadlines();
    return () => { mounted = false; };
  }, []);

  // Build uploader options from live data
  const uploaderOptions = useMemo(() => {
    const s = new Set(contracts.map(c => c.uploader).filter(Boolean));
    return Array.from(s).sort();
  }, [contracts]);

  // Derived filtered contracts from live data
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
      // date range (handle null uploaded_at gracefully)
      if (c.uploaded_at) {
        const ts = new Date(c.uploaded_at).getTime();
        if (fromTime && ts < fromTime) return false;
        if (toTime && ts > toTime + 24 * 60 * 60 * 1000 - 1) return false; // inclusive end of day
      }
      return true;
    });
  }, [contracts, textQuery, risk, uploader, dateFrom, dateTo]);

  function viewContract(contractId) {
    window.location.hash = `#/contract?contractId=${encodeURIComponent(contractId)}`;
  }

  return (
    <div className="container">
      <h2 className="title" style={{ color: '#111827' }}>Dashboard</h2>

      <UploadContract />

      {/* Contracts Section */}
      <section className="filters-card" aria-label="Contract Filters">
        <h3 className="title" style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Contracts</h3>

        {/* Contracts loading/error/empty states above filters */}
        {contractsStatus === 'loading' && (
          <p className="description">Loading contracts…</p>
        )}
        {contractsStatus === 'error' && (
          <p className="error">Failed to load contracts: {contractsError}</p>
        )}
        {contractsStatus === 'empty' && (
          <p className="description">No contracts found. Upload a contract to get started.</p>
        )}

        {/* Filters/Search - shown even during loading so users can prepare filters */}
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
          {contractsStatus === 'success' && filteredContracts.length === 0 && (
            <div className="empty-state">No contracts match the current filters.</div>
          )}
          {contractsStatus === 'success' && filteredContracts.map(c => (
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
                  <span className="badge">
                    {c.uploaded_at ? new Date(c.uploaded_at).toLocaleDateString() : '—'}
                  </span>
                  <button className="btn-view" onClick={() => viewContract(c.contract_id)}>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deadlines Section */}
      <h3 className="title" style={{ marginTop: '1.5rem', color: '#111827' }}>Upcoming Deadlines</h3>
      {deadlinesStatus === 'loading' && <p className="description">Loading deadlines…</p>}
      {deadlinesStatus === 'error' && <p className="error">Failed to load deadlines: {deadlinesError}</p>}
      {deadlinesStatus === 'empty' && <p className="description">No upcoming deadlines in the next week.</p>}
      {deadlinesStatus === 'success' && (
        <ul className="list">
          {deadlines.map((d, idx) => (
            <li key={`${d.contract_id}-${d.title}-${idx}`} className="list-item">
              <div className="list-main">
                <span className="item-title">{d.title}</span>
                <span className="item-sub">Contract: {d.contract_id}</span>
              </div>
              <div className="list-meta">
                <span className="badge">{new Date(dueTimeSafe(d.due_date)).toLocaleString()}</span>
              </div>
              {d.note ? <div className="item-note">{d.note}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Make sure we can safely parse due_date strings.
 */
function dueTimeSafe(val) {
  const t = new Date(val);
  return isNaN(t.getTime()) ? new Date() : t;
}
