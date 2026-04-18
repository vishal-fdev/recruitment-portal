// src/api/api.ts

import axios from 'axios';
import { authService } from '../auth/authService';

// ✅ Proper Vite env usage
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://recruitment-portal-vpxy.onrender.com';

// ✅ Debug log (VERY IMPORTANT)
console.log('🚀 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  // ❌ REMOVE withCredentials (not needed for JWT)
});

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('➡️ API Request:', config.method?.toUpperCase(), config.url);

    return config;
  },
  (error) => Promise.reject(error),
);

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url);
    return response;
  },
  (error) => {
    console.error(
      '❌ API ERROR:',
      error?.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export default api;