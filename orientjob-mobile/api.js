import axios from 'axios';
import { API_URL } from './config';
import { getItem } from './storage';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async (cfg) => {
  const token = await getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const errMsg = (e) =>
  e.response ? e.response.data?.error || `Erreur ${e.response.status}`
             : `Serveur injoignable (${e.message})`;

export default api;