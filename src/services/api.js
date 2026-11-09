import axios from 'axios';
import { getToken, clearToken } from './token';
import { getCampanhaId } from '../utils/campanha';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://taverna-backend-eq3b.onrender.com',
});

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;

    if (status === 401 && getToken()) {   // só quando havia sessão
      clearToken();
      window.dispatchEvent(new Event('taverna:sessao-expirada'));
    }

    const detalhe = String(err.response?.data?.detail || '');
    if (status === 403 && detalhe.includes('não faz parte desta campanha')) {
      if (!['/campanhas', '/login'].includes(window.location.pathname)) {
        window.location.assign('/campanhas');
      }
    }

    return Promise.reject(err);
  }
);

api.interceptors.request.use(cfg => {
  cfg.headers['X-Campanha-Id'] = getCampanhaId();
  return cfg;
});

export default api;