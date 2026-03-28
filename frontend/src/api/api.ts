// src/api/api.ts

import axios from 'axios';
import { authService } from '../auth/authService';

/**
 * ✅ Smart API URL handling
 * - Uses VITE_API_URL if defined
 * - Falls back to localhost for dev
 */
const API_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * ✅ Axios instance
 */
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

/**
 * ✅ Optional: Response interceptor for better debugging
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response || error.message);
    return Promise.reject(error);
  }
);

export default api;