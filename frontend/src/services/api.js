import axios from 'axios';

export const TOKEN_KEY = 'uniconnect_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  // 90s so the first request can wake a sleeping free-tier backend (cold start).
  timeout: 90000,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const hadToken = Boolean(error?.config?.headers?.Authorization);
    if (status === 401 && hadToken && !url.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('uniconnect:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
