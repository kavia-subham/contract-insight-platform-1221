import React, { useEffect, useMemo, useState } from 'react';
import { fetchContractInsights } from '../api';
import './contract.css';

// Helper: try parse insights to object
function parseInsights(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw_text: raw };
    }
  }
  return raw;
}

// Map of group meta: icon and label
const GROUP_META = {
  terms: { icon: '📑', label: 'Key Terms' },
  deadlines: { icon: '⏰', label: 'Deadlines' },
  risk: { icon: '⚠️', label: 'Risks' },
  obligations: { icon: '🧾', label: 'Obligations' },
  parties: { icon: '👥', label: 'Parties' },
  fees: { icon: '💲', label: 'Fees' },
  other: { icon: '🧩', label: 'Other' },
};

// PUBLIC_INTERFACE
/**
 * ContractDetail shows insights for a contract.
 * Props:
 * - contractId: string - the contract ID to load
 */
export default function ContractDetail({ contractId }) {
  const [insights, setInsights] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | empty
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let mounted = true;
    async function load() {
      setStatus('loading');
      setError('');
      try {
        const data = await fetchContractInsights(contractId);
        if (!mounted) return;
        if (data && (data.insights !== undefined && data.insights !== null)) {
          setInsights(parseInsights(data.insights));
          setStatus('success');
        } else {
          setInsights(null);
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
  }, [contractId]);

  // Group insights by type if possible
  const grouped = useMemo(() => {
    const obj = insights || {};
    // Common shapes supported:
    // 1) { terms:[], deadlines:[], risk:[], ... }
    // 2) { items:[{type:'risk'|'terms'|'deadlines', label:'', value:'', confidence:0.92}] }
    const result = {};
    if (Array.isArray(obj.items)) {
      for (const it of obj.items) {
        const t = (it.type || 'other').toLowerCase();
        if (!result[t]) result[t] = [];
        result[t].push(it);
      }
    } else {
      // For each known group key, ensure array
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          result[key] = obj[key];
        }
      }
      // fallback for raw_text etc.
      if (!Object.keys(result).length && obj.raw_text) {
        result.other = [{ type: 'other', label: 'Raw', value: obj.raw_text, confidence: 0.5 }];
      }
    }
    return result;
  }, [insights]);

  // Compute risk summary for a simple horizontal bar
  const riskSummary = useMemo(() => {
    const risks = grouped.risk || [];
    if (!risks.length) return { low: 0, medium: 0, high: 0, total: 0 };
    const buckets = { low: 0, medium: 0, high: 0 };
    for (const r of risks) {
      const c = typeof r.confidence === 'number' ? r.confidence : (r.score ?? 0.5);
      if (c >= 0.75) buckets.high += 1;
      else if (c >= 0.5) buckets.medium += 1;
      else buckets.low += 1;
    }
    const total = risks.length;
    return { ...buckets, total };
  }, [grouped]);

  // pretty print as fallback
  const prettyInsights = useMemo(() => {
    if (!insights) return '';
    try {
      return JSON.stringify(insights, null, 2);
    } catch {
      return String(insights);
    }
  }, [insights]);

  function confidenceClass(c) {
    const v = typeof c === 'number' ? c : 0.5;
    if (v >= 0.75) return 'chip chip-high';
    if (v >= 0.5) return 'chip chip-medium';
    return 'chip chip-low';
  }

  function conciseValue(v) {
    if (v == null) return '—';
    if (typeof v === 'string') return v.length > 140 ? v.slice(0, 137) + '…' : v;
    if (typeof v === 'number') return String(v);
    if (v?.label && v?.value === undefined) return v.label;
    try {
      const s = JSON.stringify(v);
      return s.length > 140 ? s.slice(0, 137) + '…' : s;
    } catch {
      return String(v);
    }
  }

  const sectionOrder = ['terms', 'deadlines', 'risk', 'obligations', 'parties', 'fees', 'other'];

  return (
    <div className="container">
      <h2 className="title">Contract Insights</h2>
      {!contractId && <p className="error">No contract selected.</p>}
      {status === 'loading' && <p className="description">Loading insights…</p>}
      {status === 'error' && <p className="error">Failed to load insights: {error}</p>}
      {status === 'empty' && <p className="description">No insights available for this contract.</p>}

      {status === 'success' && (
        <div className="insights-layout">
          {/* Summary strip */}
          <section className="summary-card" aria-label="Insight Summary">
            <div className="summary-row">
              <div className="summary-pill">
                📑 <span>{(grouped.terms?.length || 0)} terms</span>
              </div>
              <div className="summary-pill">
                ⏰ <span>{(grouped.deadlines?.length || 0)} deadlines</span>
              </div>
              <div className="summary-pill">
                ⚠️ <span>{(grouped.risk?.length || 0)} risks</span>
              </div>
            </div>

            {/* Minimal risk bar */}
            <div className="risk-bar" role="meter" aria-valuemin={0} aria-valuemax={riskSummary.total || 1} aria-valuenow={riskSummary.total}>
              {riskSummary.total > 0 ? (
                <>
                  <div
                    className="risk-seg low"
                    style={{ width: `${(riskSummary.low / riskSummary.total) * 100}%` }}
                    title={`Low: ${riskSummary.low}`}
                  />
                  <div
                    className="risk-seg medium"
                    style={{ width: `${(riskSummary.medium / riskSummary.total) * 100}%` }}
                    title={`Medium: ${riskSummary.medium}`}
                  />
                  <div
                    className="risk-seg high"
                    style={{ width: `${(riskSummary.high / riskSummary.total) * 100}%` }}
                    title={`High: ${riskSummary.high}`}
                  />
                </>
              ) : (
                <div className="risk-seg none" style={{ width: '100%' }} title="No risks" />
              )}
            </div>
          </section>

          {/* Sections */}
          {sectionOrder.map((key) => {
            const items = grouped[key];
            if (!items || items.length === 0) return null;
            const meta = GROUP_META[key] || GROUP_META.other;
            return (
              <section key={key} className="insight-section" aria-label={`${meta.label} Section`}>
                <h3 className="section-heading">
                  <span className="icon">{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className="count">{items.length}</span>
                </h3>
                <ul className="insight-list">
                  {items.map((it, idx) => {
                    // Normalize expected fields: label/title/name, value, confidence, due_date
                    const label = it.label || it.title || it.name || key;
                    const value = it.value ?? it.detail ?? it.description ?? it.text ?? it.due_date ?? '';
                    const conf = typeof it.confidence === 'number' ? it.confidence : (typeof it.score === 'number' ? it.score : undefined);
                    const metaRight = it.due_date
                      ? new Date(it.due_date).toLocaleDateString()
                      : (it.severity || it.priority || '');

                    return (
                      <li key={idx} className="insight-item">
                        <div className="insight-main">
                          <div className="insight-label">{label}</div>
                          <div className="insight-value">{conciseValue(value)}</div>
                        </div>
                        <div className="insight-meta">
                          {conf !== undefined && (
                            <span className={confidenceClass(conf)} title={`Confidence: ${(conf * 100).toFixed(0)}%`}>
                              {(conf * 100).toFixed(0)}%
                            </span>
                          )}
                          {metaRight ? <span className="meta-text">{metaRight}</span> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {/* Raw JSON fallback */}
          <details className="raw-json">
            <summary>Show raw JSON</summary>
            <div className="card-surface">
              <pre className="code-block" aria-label="Contract Insights JSON">
{prettyInsights}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
