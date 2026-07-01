// One place for every API call: JSON handling, cookies, consistent errors,
// and a silent token refresh when the short-lived access token expires.

let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

let refreshPromise = null;
// If several requests get 401 at the same time, only ONE refresh call is made
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api(path, { method = 'GET', body, retry = true } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'include', // send the httpOnly cookies
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access token expired -> refresh once, then retry the original request
  if (res.status === 401 && retry && !path.startsWith('/api/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) return api(path, { method, body, retry: false });
    onSessionExpired();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const error = new Error(data.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}
