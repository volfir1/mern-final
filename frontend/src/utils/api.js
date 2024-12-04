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
    // Validate response data
    if (response.data === "null" || response.data === null) {
      return response; // Don't throw error, just return response
    }

    try {
      // If data is string, try to parse it
      if (typeof response.data === 'string') {
        response.data = JSON.parse(response.data);
      }
    } catch (e) {
      console.warn('Response data parsing failed:', e);
    }

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
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    console.error('API Error:', errorDetails);

    // Handle different error types
    if (!error.response) {
      throw new Error('Network error: Please check your connection');
    }

    let errorMessage;
    try {
      if (error.response.status === 400) {
        // Handle null response
        if (error.response.data === "null" || error.response.data === null) {
          errorMessage = "Authentication failed: Invalid response from server";
        }
        // Handle string response
        else if (typeof error.response.data === 'string') {
          try {
            const parsed = JSON.parse(error.response.data);
            errorMessage = parsed.message || "Authentication failed";
          } catch (e) {
            errorMessage = error.response.data || "Authentication failed";
          }
        }
        // Handle object response
        else {
          errorMessage = error.response.data?.message || "Authentication failed";
        }
      } else {
        errorMessage = error.response.data?.message || error.message;
      }
    } catch (e) {
      errorMessage = "An unexpected error occurred";
      console.error('Error parsing error response:', e);
    }

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