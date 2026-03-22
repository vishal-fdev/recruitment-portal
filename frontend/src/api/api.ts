// src/api/api.ts
import axios from 'axios';
import { authService } from '../auth/authService';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not defined');
}

const api = axios.create({
  baseURL: API_URL,
});

/**
 * ✅ Attach JWT token automatically
 */
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;