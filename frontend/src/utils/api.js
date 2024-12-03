import axios from 'axios';
import { TokenManager } from './tokenManager';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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
      // Log outgoing requests in development
      if (import.meta.env.DEV) {
        console.log('API Request:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data
        });
      }
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    // Network errors
    if (!error.response) {
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        config: error.config
      });
      throw new Error('Network error - please check your connection');
    }

    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        // Unauthorized - token expired or invalid
        try {
          // You might want to handle token refresh here
          await TokenManager.clearAuth();
          window.location.href = '/login';
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
        throw new Error('Session expired. Please login again.');

      case 403:
        throw new Error('You do not have permission to perform this action');

      case 404:
        throw new Error('The requested resource was not found');

      case 422:
        // Validation errors
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          throw new Error(Object.values(validationErrors).join(', '));
        }
        throw new Error('Validation failed');

      case 500:
        throw new Error('Internal server error. Please try again later.');

      default:
        // Get error message from response or use default
        const errorMessage = error.response?.data?.message 
          || error.message 
          || 'An unexpected error occurred';
        throw new Error(errorMessage);
    }
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