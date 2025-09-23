 // PUBLIC_INTERFACE
 /**
  * Get the backend API base URL from environment variables.
  * Uses REACT_APP_API_BASE_URL or defaults to empty string (relative).
  */
export function getApiBaseUrl() {
  // Note: In CRA, env vars must be prefixed with REACT_APP_
  return process.env.REACT_APP_API_BASE_URL || '';
}

/**
 * Build a URL by joining base and path safely.
 */
function joinUrl(base, path) {
  if (!base) return path; // relative request
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

// PUBLIC_INTERFACE
/**
 * Fetch contract insights by contract ID.
 * @param {string} contractId - The contract identifier
 * @returns {Promise<{contract_id: string, insights: string|null}>}
 */
export async function fetchContractInsights(contractId) {
  const url = joinUrl(getApiBaseUrl(), `/contracts/${encodeURIComponent(contractId)}/insights`);
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch insights (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
/**
 * Fetch upcoming deadlines.
 * @param {number} days - number of days ahead to include (optional)
 * @returns {Promise<Array<{contract_id: string, title: string, due_date: string, note?: string|null}>>}
 */
export async function fetchUpcomingDeadlines(days) {
  const qs = typeof days === 'number' ? `?days=${encodeURIComponent(days)}` : '';
  const url = joinUrl(getApiBaseUrl(), `/deadlines/upcoming${qs}`);
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch deadlines (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}
