import axios from 'axios';
import { getToken, clearToken } from './token';

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
    if (err.response?.status === 401 && getToken()) {   // só quando havia sessão
      clearToken();
      window.dispatchEvent(new Event('taverna:sessao-expirada'));
    }
    return Promise.reject(err);
  }
);

export default api;