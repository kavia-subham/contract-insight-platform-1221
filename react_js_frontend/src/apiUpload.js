 // PUBLIC_INTERFACE
 /**
  * Upload a contract PDF to the backend.
  * Uses REACT_APP_API_BASE_URL for the base URL and POSTs multipart/form-data to /contracts.
  * Returns JSON: { contract_id, text_preview, insights?, message }
  */
export async function uploadContractPdf(file, { signal } = {}) {
  if (!file) {
    throw new Error('No file provided');
  }
  if (file.type !== 'application/pdf') {
    // In case some browsers don't set type correctly, we'll still allow but warn.
    // However, we enforce ".pdf" in UI accept attribute.
    console.warn('Selected file is not application/pdf; attempting upload anyway.');
  }

  const base = process.env.REACT_APP_API_BASE_URL || '';
  const url = base ? `${base.replace(/\/$/, '')}/contracts` : '/contracts';

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(url, {
    method: 'POST',
    body: form,
    headers: {
      // Let browser set proper multipart boundary; do not set Content-Type manually.
      Accept: 'application/json',
    },
    signal,
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    let message = text || res.statusText || 'Upload failed';
    throw new Error(`Upload failed (${res.status}): ${message}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    // Fallback in case backend returns non-JSON
    return { message: text || 'Uploaded', contract_id: '' };
  }
}
