import axios from 'axios';
import { TokenManager } from './tokenManager';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});
// Request interceptor with enhanced error handling
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await TokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Enhanced request logging
      if (import.meta.env.DEV) {
        console.log('API Request:', {
          url: `${config.baseURL}${config.url}`,
          method: config.method,
          headers: config.headers,
          data: config.data,
          timestamp: new Date().toISOString()
        });
      }
      return config;
    } catch (error) {
      console.error('Request interceptor error:', {
        message: error.message,
        stack: error.stack
      });
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request configuration error:', {
      message: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString()
      });
    }
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      timestamp: new Date().toISOString()
    });

    if (!error.response) {
      throw new Error(`Network error: ${error.message}`);
    }

    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
);

// Add request/response timing in development
if (import.meta.env.DEV) {
  api.interceptors.request.use((config) => {
    config.metadata = { startTime: new Date() };
    return config;
  });

  api.interceptors.response.use((response) => {
    const endTime = new Date();
    const startTime = response.config.metadata.startTime;
    const duration = endTime - startTime;
    console.log(`Request to ${response.config.url} took ${duration}ms`);
    return response;
  });
}

// Export configured axios instance
export default api;