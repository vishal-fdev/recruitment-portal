// src/api/api.ts

import axios from 'axios';
import { authService } from '../auth/authService';

// ✅ FORCE correct API URL
const API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  'https://recruitment-portal-vpxy.onrender.com'; // ✅ YOUR BACKEND

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ important for CORS
});

// ✅ Attach JWT token
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

// ✅ Better error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      'API Error:',
      error?.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default api;