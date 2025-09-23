 // PUBLIC_INTERFACE
 /**
  * Fetch list of contracts from backend.
  * Uses REACT_APP_API_BASE_URL and GET /contracts.
  * Returns Promise<Array<{contract_id:string, filename:string, text_preview:string, has_insights:boolean}>>.
  */
export async function fetchContracts() {
  const base = process.env.REACT_APP_API_BASE_URL || '';
  const url = base ? `${base.replace(/\/$/, '')}/contracts` : '/contracts';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`Failed to fetch contracts (${res.status}): ${text || res.statusText}`);
  }
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}
