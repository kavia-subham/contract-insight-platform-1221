import React, { useRef, useState } from 'react';
import { uploadContractPdf } from '../apiUpload';
import './upload.css';

// PUBLIC_INTERFACE
/**
 * UploadContract renders a PDF upload form with status feedback.
 * - Provides loading, success, and error states.
 * - On success, offers navigation to Contract Detail page.
 */
export default function UploadContract() {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setStatus('error');
      setMessage('Please select a PDF file.');
      return;
    }
    setStatus('loading');
    setMessage('');
    setResult(null);

    try {
      const controller = new AbortController();
      const data = await uploadContractPdf(file, { signal: controller.signal });
      setResult(data);
      setStatus('success');
      setMessage(data?.message || 'Upload and analysis completed.');
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Upload failed. Please try again.');
    }
  }

  function goToDetail() {
    if (!result?.contract_id) return;
    window.location.hash = `#/contract?contractId=${encodeURIComponent(result.contract_id)}`;
  }

  return (
    <section className="upload-card" aria-label="Upload Contract PDF">
      <h3 className="section-title">Upload Contract (PDF)</h3>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="file-input"
            aria-label="Select contract PDF to upload"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
          >
            {status === 'loading' ? 'Uploading…' : 'Upload'}
          </button>
        </div>

        {status === 'loading' && (
          <div className="inline-note loading">
            <span className="spinner" aria-hidden="true" /> Uploading and analyzing your contract…
          </div>
        )}
        {status === 'error' && (
          <div className="inline-note error" role="alert">
            {message}
          </div>
        )}
        {status === 'success' && (
          <div className="inline-note success" role="status">
            <div className="success-row">
              <span className="success-dot" aria-hidden="true" />
              <span>{message}</span>
            </div>
            <div className="result-meta">
              <div><strong>Contract ID:</strong> {result?.contract_id || '—'}</div>
              {result?.text_preview ? (
                <div className="preview">
                  <strong>Text preview:</strong>
                  <div className="preview-box">{result.text_preview}</div>
                </div>
              ) : null}
            </div>
            <div className="actions">
              <button className="btn-secondary" type="button" onClick={goToDetail} disabled={!result?.contract_id}>
                View Insights
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
