// src/utils/authUtils.js
import { serverTimestamp } from "firebase/firestore";
import { doc, setDoc, getDoc, writeBatch } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { auth, db, realtimeDb } from "../config/firebase.config";
import { TokenManager } from "./tokenManager";

// Route Constants
export const PUBLIC_ROUTES = [
  '/login', 
  '/register', 
  '/verify-email', 
  '/reset-password', 
  '/forgot-password'
];
export const ADMIN_ROUTES = ['/admin'];
export const USER_ROUTES = ['/user'];

// Database Operations
export const updateUserData = async (uid, data, options = {}) => {
  const { updateFirestore = true, updateRealtimeDb = true } = options;
  
  try {
    const batch = writeBatch(db);
    const updates = [];

    if (updateFirestore) {
      const userRef = doc(db, "users", uid);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      
      batch.set(userRef, updateData, { merge: true });
      updates.push(batch.commit());
    }

    if (updateRealtimeDb) {
      const realtimeUpdate = set(ref(realtimeDb, `users/${uid}`), {
        ...data,
        lastUpdated: new Date().toISOString(),
      });
      updates.push(realtimeUpdate);
    }

    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error("Database update error:", {
      error,
      uid,
      data,
      options
    });
    throw new Error("Failed to update user data");
  }
};

// Data Validation
export const validateUserData = (userData) => {
  if (!userData) {
    throw new Error("User data is required");
  }

  const requiredFields = ["email", "role", "uid"];
  const missingFields = requiredFields.filter((field) => !userData[field]);

  if (missingFields.length > 0) {
    console.error("Invalid user data:", { 
      userData, 
      missingFields 
    });
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  return {
    ...userData,
    role: TokenManager.validateRole(userData.role),
    email: userData.email.toLowerCase(),
    emailVerified: Boolean(userData.emailVerified),
  };
};

// Auth State Management
export const handleAuthState = async (firebaseUser, setStates) => {
  if (!firebaseUser) {
    await handleAuthClear(setStates);
    return false;
  }

  try {
    // Get fresh token and user data
    const [token, userData] = await Promise.all([
      TokenManager.getToken(true),
      getUserData(firebaseUser.uid)
    ]);

    // Validate and update user data
    const validatedUser = validateUserData({
      ...userData,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
    });

    // Update token and user data
    await TokenManager.setUser(validatedUser);
    
    // Update state
    setStates.setUser(validatedUser);
    setStates.setIsAuthenticated(true);
    setStates.setRoleLoaded(true);

    return validatedUser.role;
  } catch (error) {
    console.error("Auth state error:", error);
    await handleAuthClear(setStates);
    throw error;
  }
};

// Helper function to get user data
const getUserData = async (uid) => {
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Create new user document if it doesn't exist
    const defaultUserData = {
      email: auth.currentUser?.email,
      role: "user",
      createdAt: serverTimestamp(),
      isActive: true,
      emailVerified: auth.currentUser?.emailVerified,
    };
    await setDoc(userDocRef, defaultUserData);
    return defaultUserData;
  }

  return userDoc.data();
};

// Helper function to clear auth state
const handleAuthClear = async (setStates) => {
  await TokenManager.clearAuth();
  setStates.setUser(null);
  setStates.setIsAuthenticated(false);
  setStates.setRoleLoaded(false);
};

// Route Protection
export const isPublicRoute = (path) => 
  PUBLIC_ROUTES.some(route => path.startsWith(route));

export const getRedirectPath = (role) => 
  role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

export const checkAuthRedirect = (isAuthenticated, role, pathname) => {
  // Not authenticated trying to access protected route
  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return '/login';
  }
  
  // Authenticated trying to access public route
  if (isAuthenticated && isPublicRoute(pathname)) {
    return getRedirectPath(role);
  }

  // Role-based redirects
  if (role === 'admin' && !pathname.startsWith('/admin')) {
    return '/admin/dashboard';
  }

  if (role === 'user' && !pathname.startsWith('/user')) {
    return '/user/dashboard';
  }

  return null;
};

// Error Handling
export const firebaseErrorMessages = {
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Invalid password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/requires-recent-login': 'Please log in again to complete this action.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
  'auth/expired-action-code': 'This link has expired.',
  'auth/invalid-action-code': 'This link is invalid.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/invalid-credential': 'Invalid login credentials.',
  'auth/invalid-verification-code': 'Invalid verification code.',
  'auth/invalid-verification-id': 'Invalid verification ID.',
  'auth/missing-verification-code': 'Missing verification code.',
  'auth/missing-verification-id': 'Missing verification ID.',
};

export const handleFirebaseError = (error, defaultMessage = 'An error occurred') => {
  const errorCode = error.code;
  const errorMessage = firebaseErrorMessages[errorCode] || error.message || defaultMessage;
  
  console.error('Firebase error:', { 
    code: errorCode, 
    message: errorMessage, 
    original: error 
  });
  
  return errorMessage;
};

export const handleApiError = (error) => {
  const response = error.response;
  const defaultMessage = 'An error occurred while processing your request';

  // Session expired
  if (response?.status === 401) {
    TokenManager.clearAuth();
    return 'Your session has expired. Please log in again.';
  }

  // Rate limiting
  if (response?.status === 429) {
    return 'Too many requests. Please try again later.';
  }

  // Server error
  if (response?.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return response?.data?.message || error.message || defaultMessage;
};

// Verification Helpers
export const generateVerificationUrl = (token) => 
  `${window.location.origin}/verify-email?token=${token}`;

export const generatePasswordResetUrl = (token) => 
  `${window.location.origin}/reset-password?token=${token}`;

// Role Validation
export const validateRole = (role) => {
  const validRoles = ['user', 'admin'];
  return validRoles.includes(role) ? role : 'user';
};

export const hasRequiredRole = (userRole, requiredRole) => {
  if (requiredRole === 'admin') {
    return userRole === 'admin';
  }
  return true; // User role can access user routes
};