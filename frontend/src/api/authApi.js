import api from '../utils/api';
import { TokenManager } from '../utils/tokenManager';
import { auth } from '../config/firebase.config';

const API_ENDPOINTS = {
    // Existing endpoints
    base: '/auth',
    login: '/auth/login',
    register: '/auth/register',
    googleLogin: '/auth/google-login',
    logout: '/auth/logout',
    check: '/auth/check',
    resendVerification: '/auth/resend-verification',
    verifyEmail: '/auth/verify-email',
    
    // New endpoints
    verifyToken: '/auth/verify-token',
    verifyStatus: '/auth/verify-status',
    verifyRole: '/auth/verify-role',
    syncVerification: '/auth/sync-verification',
    changePassword: '/auth/change-password'
};


// Helper function to handle API responses
const handleResponse = (response) => {
  console.log(`API Response for ${response.config.url}:`, response.data);
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Operation failed');
  }
  
  return response.data;
};

export const googleLogin = async (credential) => {
  try {
    console.log('Initiating Google login with credential:', { credential });
    
    const response = await axiosInstance.post(API_ENDPOINTS.googleLogin, { credential });
    const data = handleResponse(response);
    
    if (data.success && data.user) {
      TokenManager.setUser(data.user);
    }
    
    return data;
  } catch (error) {
    console.error('Google login error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.message || 'Google login failed');
  }
};

export const register = async (params) => {
  try {
    console.log('Registering new user:', params);
    
    const response = await axiosInstance.post(API_ENDPOINTS.register, params);
    return handleResponse(response);
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const login = async (credentials) => {
  try {
      console.log('Attempting login for user:', credentials.email);
      
      // First authenticate with Firebase
      const userCredential = await auth.signInWithEmailAndPassword(
          credentials.email,
          credentials.password
      );

      // Get Firebase token
      const token = await userCredential.user.getIdToken();
      await TokenManager.setToken(token);

      // Now authenticate with backend
      const response = await api.post(API_ENDPOINTS.login, credentials);
      const data = handleResponse(response);
      
      if (data.success && data.user) {
          await TokenManager.setUser(data.user);
      }
      
      return data;
  } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
  }
};


export const logout = async () => {
  try {
      console.log('Logging out user');
      
      // First logout from backend
      const response = await api.post(API_ENDPOINTS.logout);
      const data = handleResponse(response);
      
      // Then clear auth state and Firebase
      await TokenManager.clearAuth();
      
      return data;
  } catch (error) {
      console.error('Logout error:', error);
      await TokenManager.clearAuth(); // Clear auth even if API call fails
      throw new Error(error.response?.data?.message || 'Logout failed');
  }
};


export const verifyToken = async () => {
  try {
      const token = await TokenManager.getToken(true);
      const response = await api.post(API_ENDPOINTS.verifyToken, { 
          firebaseToken: token 
      });
      return handleResponse(response);
  } catch (error) {
      console.error('Token verification error:', error);
      throw new Error(error.response?.data?.message || 'Token verification failed');
  }
};


export const verifyStatus = async () => {
  try {
      const response = await api.get(API_ENDPOINTS.verifyStatus);
      return handleResponse(response);
  } catch (error) {
      console.error('Status verification error:', error);
      throw new Error(error.response?.data?.message || 'Status verification failed');
  }
};

export const verifyRole = async () => {
  try {
      const response = await api.get(API_ENDPOINTS.verifyRole);
      return handleResponse(response);
  } catch (error) {
      console.error('Role verification error:', error);
      throw new Error(error.response?.data?.message || 'Role verification failed');
  }
};


export const syncVerification = async () => {
  try {
      const response = await api.post(API_ENDPOINTS.syncVerification);
      return handleResponse(response);
  } catch (error) {
      console.error('Sync verification error:', error);
      throw new Error(error.response?.data?.message || 'Sync verification failed');
  }
};


export const checkAuth = async () => {
  try {
    console.log('Checking authentication status');
    
    const response = await axiosInstance.get(API_ENDPOINTS.check);
    return handleResponse(response);
  } catch (error) {
    console.error('Auth check error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.message || 'Authentication check failed');
  }
};

export const resendVerification = async (email) => {
  try {
    console.log('Resending verification email to:', email);
    
    const response = await axiosInstance.post(API_ENDPOINTS.resendVerification, { email });
    return handleResponse(response);
  } catch (error) {
    console.error('Resend verification error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.message || 'Failed to resend verification email');
  }
};

export const verifyEmail = async (email, password) => {
  try {
    console.log('Verifying email for user:', email);
    
    const response = await axiosInstance.post(API_ENDPOINTS.verifyEmail, { email, password });
    return handleResponse(response);
  } catch (error) {
    console.error('Email verification error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.message || 'Email verification failed');
  }
};

export const isEmailVerified = (user) => {
  return user?.emailVerified || false;
};

export default {
  googleLogin,
  register,
  login,
  logout,
  checkAuth,
  resendVerification,
  verifyEmail,
  isEmailVerified,

  verifyToken,
    verifyStatus,
    verifyRole,
    syncVerification
};