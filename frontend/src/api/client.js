import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL });

const TOKEN_KEY = 'feesup_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired or invalid token → clear session and send user to login (except auth endpoints).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || '';
    const isAuthRoute = /\/api\/auth\/(login|signup)/.test(url);
    if (status === 401 && !isAuthRoute && getToken()) {
      setToken(null);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

// Normalize API error messages for the UI.
export function apiErrorMessage(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}
