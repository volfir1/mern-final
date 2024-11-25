  // utils/tokenManager.js
  import { auth } from '../config/firebase.config';
  import axios from 'axios';

  const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
  };

  export const TokenManager = {
    // Storage keys
    STORAGE_KEYS: {
      TOKEN: 'auth_token',
      FIREBASE_TOKEN: 'firebase_token',
      USER: 'auth_user',
      ROLE: 'user_role'
    },

    // Role validation with detailed logging
    validateRole: (role) => {
      const validRole = role?.toLowerCase()?.trim();
      if (!validRole || !Object.values(ROLES).includes(validRole)) {
        console.warn(`Invalid role "${role}" defaulting to "user"`);
        return ROLES.USER;
      }
      return validRole;
    },

    // Enhanced token management
    getToken: async (forceRefresh = false) => {
      try {
        console.log('Getting token...'); // Debug log

        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No current user found in getToken');
          return null;
        }

        console.log('Getting token for user:', currentUser.uid); // Debug log

        const token = forceRefresh ? 
          await currentUser.getIdToken(true) : 
          await currentUser.getIdToken();

        if (token) {
          // Store token
          localStorage.setItem(TokenManager.STORAGE_KEYS.TOKEN, token);
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Token successfully retrieved and stored'); // Debug log
        } else {
          console.warn('Failed to get token from Firebase');
        }

        return token;
      } catch (error) {
        console.error('Error in getToken:', error);
        return null;
      }
  },

    // Set token with validation
    setToken: async (token, isFirebaseToken = false) => {
      try {
        if (!token) {
          throw new Error('Invalid token provided');
        }
    
        // Store both Firebase and regular token
        localStorage.setItem(TokenManager.STORAGE_KEYS.TOKEN, token);
        if (isFirebaseToken) {
          localStorage.setItem(TokenManager.STORAGE_KEYS.FIREBASE_TOKEN, token);
        }
    
        // Set Axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Add debug log
        console.debug('Token set successfully:', { 
          isFirebaseToken, 
          tokenLength: token.length 
        });
        
        return true;
      } catch (error) {
        console.error('Error setting token:', error);
        return false;
      }
    },

    // Enhanced user management with role
    setUser: async (user) => {
      try {
        if (!user) {
          throw new Error('Invalid user data');
        }

        // Validate and set role
        const validatedUser = {
          ...user,
          role: TokenManager.validateRole(user.role)
        };

        localStorage.setItem(
          TokenManager.STORAGE_KEYS.USER, 
          JSON.stringify(validatedUser)
        );

        // Store role separately for quick access
        localStorage.setItem(
          TokenManager.STORAGE_KEYS.ROLE, 
          validatedUser.role
        );

        return true;
      } catch (error) {
        console.error('Error setting user:', error);
        return false;
      }
    },

    getUser: () => {
      try {
        const userData = localStorage.getItem(TokenManager.STORAGE_KEYS.USER);
        if (!userData) return null;

        const user = JSON.parse(userData);
        return {
          ...user,
          role: TokenManager.validateRole(user.role)
        };
      } catch (error) {
        console.error('Error getting user:', error);
        return null;
      }
    },

    // Role management
    getUserRole: () => {
      try {
        const role = localStorage.getItem(TokenManager.STORAGE_KEYS.ROLE);
        return TokenManager.validateRole(role);
      } catch (error) {
        console.error('Error getting user role:', error);
        return ROLES.USER;
      }
    },

    isAdmin: () => {
      return TokenManager.getUserRole() === ROLES.ADMIN;
    },

    // Clear auth state
    clearAuth: async () => {
      try {
        // Clear all storage
        Object.values(TokenManager.STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });

        // Clear axios headers
        delete axios.defaults.headers.common['Authorization'];

        // Sign out from Firebase
        await auth.signOut();

        console.debug('Auth state cleared successfully');
        return true;
      } catch (error) {
        console.error('Error clearing auth state:', error);
        return false;
      }
    },

    // Verify auth state
    verifyAuth: async () => {
      try {
        const token = await TokenManager.getToken();
        const user = TokenManager.getUser();
        const role = TokenManager.getUserRole();
        const axiosAuth = axios.defaults.headers.common['Authorization'];

        const state = {
          hasToken: !!token,
          hasUser: !!user,
          hasRole: !!role,
          hasAxiosAuth: !!axiosAuth,
          role: role
        };

        console.debug('Auth state verification:', state);

        return state.hasToken && state.hasUser && state.hasRole && state.hasAxiosAuth;
      } catch (error) {
        console.error('Error verifying auth state:', error);
        return false;
      }
    }
  };

  export const enhancedTokenManager = {
    ...TokenManager,
    clearAuthAndFirebase: async () => {
        try {
            if (auth.currentUser) {
                await auth.currentUser.delete();
            }
        } catch (error) {
            console.error('Error clearing Firebase auth:', error);
        }
        await TokenManager.clearAuth();
    }
  };
  // Initialize function
  export const initializeTokenManager = async () => {
    try {
      // Get fresh Firebase token
      const firebaseToken = await TokenManager.getToken(true);
      if (!firebaseToken) {
        console.debug('No Firebase token available during initialization');
        return false;
      }

      // Verify and set tokens
      const isValid = await TokenManager.verifyToken(firebaseToken);
      if (isValid) {
        await TokenManager.setToken(firebaseToken, true);
        console.debug('TokenManager initialized successfully');
        return true;
      }

      console.debug('Token validation failed during initialization');
      return false;
    } catch (error) {
      console.error('Error initializing TokenManager:', error);
      return false;
    }
  };

  export const verifyToken = async (token) => {
    try {
      if (!token) {
        console.debug('No token provided for verification');
        return false;
      }

      const response = await api.post('/api/auth/verify-token', 
        { token },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // If verification is successful, ensure the token is set
        await TokenManager.setToken(token);
        console.debug('Token verified and set successfully');
        return true;
      }

      console.debug('Token verification failed:', response.data.message);
      return false;
    } catch (error) {
      console.error('Token verification error:', error.message);
      return false;
    }
  };