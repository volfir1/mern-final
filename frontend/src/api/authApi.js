// utils/authApi.js
import axiosInstance from '../utils/api';

// Enhanced error handling
class AuthError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.data = data;
  }
}

// Enhanced response handler
const handleResponse = async (response) => {
  if (!response.data.success) {
    throw new AuthError(
      response.data.message || 'Operation failed',
      response.status,
      response.data
    );
  }
  return response.data;
};

// Enhanced error handler
const handleError = (error, context) => {
  console.error(`${context} error:`, {
    message: error.message,
    status: error.status,
    data: error.data
  });
  throw error;
};

// Token management
export const TokenManager = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },
  removeUser: () => localStorage.removeItem('user'),
  clearAuth: () => {
    TokenManager.removeToken();
    TokenManager.removeUser();
  }
};

export const authApi = {
  // Auth state management
  initialize: async () => {
    const token = TokenManager.getToken();
    if (token) {
      try {
        const response = await authApi.checkAuth();
        return response;
      } catch (error) {
        TokenManager.clearAuth();
        throw error;
      }
    }
    return null;
  },

  // Registration
  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      const data = await handleResponse(response);
      
      if (data.token) {
        TokenManager.setToken(data.token);
        TokenManager.setUser(data.user);
      }
      
      return data;
    } catch (error) {
      handleError(error, 'Registration');
    }
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      const data = await handleResponse(response);
      
      if (data.token) {
        TokenManager.setToken(data.token);
        TokenManager.setUser(data.user);
      }
      
      return data;
    } catch (error) {
      handleError(error, 'Login');
    }
  },

  // Google Login
  googleLogin: async ({ credential, isRegistration }) => {
    try {
      console.log('Attempting Google login/registration:', {
        credential,
        isRegistration
      });
      
      const response = await axiosInstance.post('/auth/google', {
        credential,
        isRegistration
      });

      const data = await handleResponse(response);

      if (data.success && data.token) {
        TokenManager.setToken(data.token);
        TokenManager.setUser(data.user);
      }

      return data;
    } catch (error) {
      handleError(error, `Google ${isRegistration ? 'registration' : 'login'}`);
    }
  },

  // Logout
  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      TokenManager.clearAuth();
    } catch (error) {
      TokenManager.clearAuth();
      handleError(error, 'Logout');
    }
  },

  // Auth Status
  checkAuth: async () => {
    try {
      const response = await axiosInstance.get('/auth/check');
      return handleResponse(response);
    } catch (error) {
      handleError(error, 'Auth check');
    }
  },

  // Profile Management
  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      return handleResponse(response);
    } catch (error) {
      handleError(error, 'Profile fetch');
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await axiosInstance.put('/auth/profile', userData);
      const data = await handleResponse(response);
      
      if (data.user) {
        TokenManager.setUser(data.user);
      }
      
      return data;
    } catch (error) {
      handleError(error, 'Profile update');
    }
  },

  // Password Management
  changePassword: async (passwordData) => {
    try {
      const response = await axiosInstance.put('/auth/change-password', passwordData);
      return handleResponse(response);
    } catch (error) {
      handleError(error, 'Password change');
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      return handleResponse(response);
    } catch (error) {
      handleError(error, 'Password reset request');
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await axiosInstance.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error, 'Password reset');
    }
  }
};

export default authApi;