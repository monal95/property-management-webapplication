import axios from "axios";

// API base URL with fallback for local development
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Debug: log resolved API base URL at runtime
if (typeof window !== 'undefined') {
  console.log('[Rentify] API base URL:', baseURL);
  console.log('[Rentify] Environment:', import.meta.env.MODE);
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data on 401
      localStorage.removeItem('token');
      localStorage.removeItem('loggedIn');
      localStorage.removeItem('role');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      // Optionally redirect to login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
