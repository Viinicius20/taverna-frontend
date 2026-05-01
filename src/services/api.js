import axios from 'axios';

const api = axios.create({
  baseURL: '`https://taverna-backend-eq3b.onrender.com`',
});

export default api;