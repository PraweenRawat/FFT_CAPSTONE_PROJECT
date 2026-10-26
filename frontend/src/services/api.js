/**
 * StockLink API Client Service
 * Centralizes all communication between frontend and backend.
 */

const getApiBase = () => {
  // 1. Explicit environment variable (configured in Vercel / Netlify / Render)
  if (import.meta.env.VITE_API_URL) {
    const raw = import.meta.env.VITE_API_URL.trim();
    return raw.endsWith('/api') ? raw : `${raw.replace(/\/+$/, '')}/api`;
  }
  // 2. If running locally in Vite dev mode (ports 5173, 3000)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const port = window.location.port;
    if ((host === 'localhost' || host === '127.0.0.1') && port !== '5000') {
      return 'http://localhost:5000/api';
    }
    // 3. In production or same-host single deployment, use relative /api
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE = getApiBase();

export const getAuthToken = () => {
  try {
    return localStorage.getItem('stocklink_token') || '';
  } catch {
    return '';
  }
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('stocklink_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  try {
    if (token) localStorage.setItem('stocklink_token', token);
    if (user)  localStorage.setItem('stocklink_user', JSON.stringify(user));
  } catch (e) {
    console.warn('Storage set error:', e);
  }
};

export const clearAuthSession = () => {
  try {
    localStorage.removeItem('stocklink_token');
    localStorage.removeItem('stocklink_user');
  } catch (e) {
    console.warn('Storage clear error:', e);
  }
};

/**
 * Generic authenticated fetch wrapper
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message || `HTTP ${res.status}: Request failed`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.warn(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

/* ============================================================
   Authentication & Profile Endpoints
   ============================================================ */

export const apiLogin = async (credentials) => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  if (data?.token && data?.user) {
    setAuthSession(data.token, data.user);
  }
  return data;
};

export const apiGetMe = async () => {
  const data = await apiRequest('/auth/me');
  if (data?.user) {
    const cur = getCurrentUser() || {};
    setAuthSession(null, { ...cur, ...data.user });
  }
  return data;
};

export const apiUpdateProfile = async (profileData) => {
  const data = await apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
  if (data?.token && data?.user) {
    setAuthSession(data.token, data.user);
  }
  return data;
};

/* ============================================================
   Dashboard Endpoints
   ============================================================ */

export const apiGetRetailerDashboard = async () => {
  return await apiRequest('/dashboard/retailer');
};

export const apiGetWholesalerDashboard = async () => {
  return await apiRequest('/dashboard/wholesaler');
};

export const apiUpdateProductPrice = async (productId, basePrice, stock) => {
  const payload = {};
  if (basePrice !== undefined) payload.basePrice = Number(basePrice);
  if (stock !== undefined) payload.stock = Number(stock);

  return await apiRequest(`/dashboard/wholesaler/product/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};
