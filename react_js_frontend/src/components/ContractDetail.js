import React, { useEffect, useMemo, useState } from 'react';
import { fetchContractInsights } from '../api';
import './contract.css';

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
          setInsights(data.insights);
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

  // pretty print if JSON string
  const prettyInsights = useMemo(() => {
    if (!insights) return '';
    if (typeof insights === 'string') {
      try {
        const obj = JSON.parse(insights);
        return JSON.stringify(obj, null, 2);
      } catch {
        return insights;
      }
    }
    try {
      return JSON.stringify(insights, null, 2);
    } catch {
      return String(insights);
    }
  }, [insights]);

  return (
    <div className="container">
      <h2 className="title">Contract Insights</h2>
      {!contractId && <p className="error">No contract selected.</p>}
      {status === 'loading' && <p className="description">Loading insights…</p>}
      {status === 'error' && <p className="error">Failed to load insights: {error}</p>}
      {status === 'empty' && <p className="description">No insights available for this contract.</p>}
      {status === 'success' && (
        <pre className="code-block" aria-label="Contract Insights JSON">
{prettyInsights}
        </pre>
      )}
    </div>
  );
}
