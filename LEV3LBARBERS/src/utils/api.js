import axios from 'axios';
import { BACKEND } from '../config';

const api = axios.create({
  baseURL: BACKEND
});

// Add token automatically if it exists
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
