// api.js
import axios from 'axios';
import { TokenManager } from './tokenManager';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await TokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error);

    // Network error handling
    if (!error.response) {
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        config: error.config
      });
      throw new Error('Network error - please check your connection');
    }

    // Server error handling
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
);

export default api;