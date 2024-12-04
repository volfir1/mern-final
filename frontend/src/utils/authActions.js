// src/utils/authActions.js
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser,
    confirmPasswordReset,
    verifyPasswordResetCode,
  } from "firebase/auth";
  import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
  import { ref, set } from "firebase/database";
  import { auth, db, realtimeDb, googleProvider } from "../config/firebase.config";
  import { 
    updateUserData, 
    handleAuthState, 
    handleFirebaseError,
    handleApiError 
  } from "./authUtils";
  import { TokenManager} from "./tokenManager";
  import api from "./api";
  import  {verifyToken}  from "./tokenManager";
  import toast from "react-hot-toast";
  import { useNavigate } from "react-router-dom";
  
  // Login with email and password
// src/utils/authActions.js
// authActions.js
export const login = async (credentials, setStates) => {
  const { setLoading, setError, navigate } = setStates;
  
  try {
    if (setLoading) setLoading(true);

    console.log('Starting login process...'); // Debug log

    // Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      credentials.email, 
      credentials.password
    );

    console.log('Firebase auth successful'); // Debug log

    // Get and verify token
    const firebaseToken = await userCredential.user.getIdToken();
    await TokenManager.setToken(firebaseToken);

    console.log('Firebase token obtained'); // Debug log

    // Backend login with error handling
    try {
      console.log('Attempting backend login...'); // Debug log
      
      const response = await api.post('/auth/login', { 
        email: credentials.email.toLowerCase(),
        firebaseToken 
      });

      console.log('Backend response:', response.data); // Debug log

      if (response.data?.success && response.data?.user) {
        const userData = response.data.user;
        await TokenManager.setUser(userData);

        const redirectPath = userData.role === 'admin' 
          ? '/admin/dashboard' 
          : '/user/dashboard';

        console.log('Redirecting to:', redirectPath); // Debug log
        
        if (navigate) navigate(redirectPath, { replace: true });
        return { success: true, user: userData };
      }

      throw new Error(response.data?.message || 'Login failed');
    } catch (apiError) {
      console.error('Backend login error:', apiError); // Debug log

      if (apiError.code === 'ERR_NETWORK') {
        // Fallback to Firebase user data if backend is unreachable
        const user = userCredential.user;
        const userData = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          role: 'user',
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        
        await TokenManager.setUser(userData);
        if (navigate) navigate('/user/dashboard', { replace: true });
        
        console.log('Using Firebase fallback data'); // Debug log
        return { success: true, user: userData };
      }

      throw apiError;
    }
  } catch (error) {
    console.error('Login process error:', error); // Debug log
    
    if (setError) {
      const errorMessage = error.code === 'ERR_NETWORK'
        ? 'Unable to connect to server. Please check your connection and try again.'
        : error.message || 'An unexpected error occurred';
      setError(errorMessage);
    }
    
    throw error;
  } finally {
    if (setLoading) setLoading(false);
  }
};
  
  // Register new user
  export const register = async (userData, setStates) => {
    const { 
      setLoading, 
      setError, 
      setUser, 
      setIsAuthenticated, 
      navigate 
    } = setStates;
  
    try {
      if (setLoading) setLoading(true);
  
      console.log('Starting registration for:', userData.email);
  
      // Your registration API call
      const response = await api.authEndpoints.register({
        email: userData.email.toLowerCase(),
        password: userData.password,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        role: 'user'
      });
  
      console.log('Registration response:', response.data);
  
      if (response.data.success) {
        const { token, user } = response.data;
  
        // Set token and user
        await TokenManager.setToken(token);
        await TokenManager.setUser(user);
  
        // Update state
        if (setUser) setUser(user);
        if (setIsAuthenticated) setIsAuthenticated(true);
  
        // Show success toast
        toast.success('Registration successful! Please check your email for verification.', {
          duration: 4000,
          position: 'top-center',
        });
  
        // Navigate after a short delay
        setTimeout(() => {
          navigate('/verify-email', {
            state: {
              email: userData.email.toLowerCase(),
              message: 'Please check your email to verify your account.'
            },
            replace: true
          });
        }, 2000);
  
        return {
          success: true,
          user,
          message: 'Registration successful! Please check your email for verification.'
        };
      }
  
      throw new Error(response.data.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
  
      // Show error toast
      toast.error(error.message || 'Registration failed. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
  
      if (setError) setError(error.message);
      
      // Clean up
      await TokenManager.clearAuth();
      throw error;
    } finally {
      if (setLoading) setLoading(false);
    }
  };



  
  // Google Sign In
  export const googleLogin = async (setStates) => {
    const { setLoading, setError, navigate } = setStates;
    try {
      setLoading(true);
  
      // Get Firebase auth result
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
  
      // Make API call with credential
      const response = await api.post("/auth/google-login", 
        { credential: idToken },
        { 
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response?.data?.success && response?.data?.user) {
        // Save tokens from backend response
        await TokenManager.setToken(response.data.tokens.accessToken);
        await TokenManager.setUser(response.data.user);
  
        // Navigate based on role
        const redirectPath = response.data.user.role === "admin" 
          ? "/admin/dashboard" 
          : "/user/dashboard";
        
        navigate(redirectPath, { replace: true });
        return response.data;
      } else {
        throw new Error(response?.data?.message || "Google authentication failed");
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Logout
  export const logout = async (navigate) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateUserData(currentUser.uid, {
          lastLogoutAt: serverTimestamp(),
          isOnline: false,
        });
      }
  
      await Promise.all([
        signOut(auth), 
        api.post("/auth/logout"),
        TokenManager.clearAuth()
      ]);
  
      navigate('/login');
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      await TokenManager.clearAuth();
      throw error;
    }
  };
  // Password Reset Functions
  export const initiatePasswordReset = async (email) => {
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      };
      
      await Promise.all([
        sendPasswordResetEmail(auth, email, actionCodeSettings),
        api.post("/auth/forgot-password", { email })
      ]);
  
      return {
        success: true,
        message: "Password reset email sent successfully"
      };
    } catch (error) {
      throw new Error(handleFirebaseError(error, "Failed to send reset email"));
    }
  };
  
  export const completePasswordReset = async (oobCode, newPassword) => {
    try {
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, newPassword);
      await api.post("/auth/reset-password/confirm", { oobCode });
      
      return {
        success: true,
        message: "Password has been reset successfully"
      };
    } catch (error) {
      throw new Error(handleFirebaseError(error, "Password reset failed"));
    }
  };
  
  // Email Verification
  export const verifyEmail = async (code, setStates) => {
    try {
      const response = await api.get(`/auth/verify-email?token=${code}`);
  
      if (response.data.success) {
        await auth.currentUser?.reload();
        setStates.setUser((prev) => ({
          ...prev,
          emailVerified: true,
        }));
        return { success: true };
      }
  
      throw new Error("Email verification failed");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setStates.setError(errorMessage);
      throw error;
    }
  };
  
  export const resendVerificationEmail = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
  
      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true
      });
  
      return {
        success: true,
        message: "Verification email sent successfully"
      };
    } catch (error) {
      throw new Error(handleFirebaseError(error, "Failed to send verification email"));
    }
  };
  
  // Profile Management
  export const updateUserProfile = async (updates, setStates) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user logged in");
  
      await updateUserData(currentUser.uid, updates);
      setStates.setUser((prev) => ({
        ...prev,
        ...updates,
      }));
      return true;
    } catch (error) {
      throw new Error(handleFirebaseError(error, "Failed to update profile"));
    }
  };
  
  export const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");
  
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await api.post("/auth/update-password", { password: newPassword });
  
      return {
        success: true,
        message: "Password updated successfully"
      };
    } catch (error) {
      throw new Error(handleFirebaseError(error, "Failed to update password"));
    }
  };
  
  // Account Deletion
  export const deleteAccount = async (password, reason, setStates) => {
    const { setUser, setIsAuthenticated } = setStates;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user is currently logged in");
  
      const userData = (await getDoc(doc(db, "users", currentUser.uid))).data();
  
      // Re-authenticate for security
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
  
      // Store deletion info and clean up
      await Promise.all([
        setDoc(doc(db, "deletedAccounts", currentUser.uid), {
          email: userData.email,
          displayName: userData.displayName,
          deletedAt: serverTimestamp(),
          lastLoginAt: userData.lastLoginAt,
          deletionReason: reason,
          role: userData.role,
          metadata: {
            deletedFrom: window.location.origin,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
        set(ref(realtimeDb, `users/${currentUser.uid}`), null),
        deleteDoc(doc(db, "users", currentUser.uid)),
        api.delete("/auth/delete-account", { data: { password, reason } }),
        deleteUser(currentUser)
      ]);
  
      await TokenManager.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error("Account deletion error:", error);
      throw new Error(handleFirebaseError(error, "Failed to delete account"));
    }
  };