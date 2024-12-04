// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { TokenManager } from './tokenManager';
import api from './api';
import {
  login as loginAction,
  register,
  googleLogin,
  logout,
} from './authActions';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null,
    roleLoaded: false,
    isAuthenticated: false
  });
  const navigate = useNavigate();

  // State update helper
  const updateState = (updates) => setState(prev => ({ ...prev, ...updates }));

  // API interceptor
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      async (config) => {
        const token = await TokenManager.getToken();
        if (token && !config.url?.includes('/auth/login')) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    return () => api.interceptors.request.eject(interceptor);
  }, []);

  // Firebase auth observer
  useEffect(() => {
    let isSubscribed = true;

    const handleAuthStateChanged = async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken(true);
          const response = await api.post('/auth/verify-token', 
            { firebaseToken: token },
            { headers: { Authorization: `Bearer ${token}` }}
          );

          if (isSubscribed && response.data?.user) {
            await TokenManager.setToken(token);
            await TokenManager.setUser(response.data.user);
            updateState({
              user: response.data.user,
              isAuthenticated: true,
              roleLoaded: true,
              error: null
            });
          }
        } else {
          if (isSubscribed) {
            await TokenManager.clearAuth();
            updateState({
              user: null,
              isAuthenticated: false,
              roleLoaded: true,
              error: null
            });
          }
        }
      } catch (err) {
        if (isSubscribed) {
          await TokenManager.clearAuth();
          updateState({
            user: null,
            isAuthenticated: false,
            roleLoaded: true,
            error: err.message
          });
        }
      } finally {
        if (isSubscribed) {
          updateState({ loading: false });
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Auth methods
  const authMethods = {
    async login(credentials) {
      try {
        updateState({ loading: true, error: null });
        const result = await loginAction(credentials, {
          setLoading: (value) => updateState({ loading: value }),
          setError: (value) => updateState({ error: value }),
          navigate
        });
        
        if (result?.user) {
          updateState({
            user: result.user,
            isAuthenticated: true,
            error: null
          });
          return { success: true };
        }
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Login failed';
        updateState({ error: message });
        toast.error(message);
        throw err;
      }
    },

    async register(userData) {
      try {
        updateState({ loading: true });
        await register(userData);
        toast.success('Registration successful! Please verify your email.');
        navigate('/verify-email', { state: { email: userData.email }});
      } catch (err) {
        toast.error(err.message || 'Registration failed');
        throw err;
      } finally {
        updateState({ loading: false });
      }
    },

    async googleLogin() {
      try {
        updateState({ loading: true });
        await googleLogin({
          setLoading: (value) => updateState({ loading: value }),
          setError: (value) => updateState({ error: value }),
          navigate
        });
      } catch (err) {
        toast.error(err.message || 'Google login failed');
        throw err;
      } finally {
        updateState({ loading: false });
      }
    },

    async logout() {
      try {
        updateState({ loading: true });
        // Call the logout action with proper parameters
        await logout(navigate);  // passing navigate directly
        
        // Clear local state
        updateState({
          user: null,
          isAuthenticated: false,
          error: null
        });
    
        // Clear tokens and storage
        await TokenManager.clearAuth();
        
        // Navigate last
        navigate('/login', { replace: true });
        
        toast.success('Logged out successfully');
      } catch (err) {
        console.error('Logout error:', err);
        toast.error(err.message || 'Logout failed');
        
        // Ensure state is cleaned up even on error
        updateState({
          user: null,
          isAuthenticated: false,
          error: err.message
        });
        await TokenManager.clearAuth();
        navigate('/login', { replace: true });
      } finally {
        updateState({ loading: false });
      }
    },
    
  };
  const cleanupAuthState = async () => {
    await TokenManager.clearAuth();
    updateState({
      user: null,
      isAuthenticated: false,
      roleLoaded: false,
      error: null
    });
  };
  
  if (state.loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      ...authMethods,
      isAdmin: () => state.user?.role === 'admin',
      isVerified: () => state.user?.emailVerified === true
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;