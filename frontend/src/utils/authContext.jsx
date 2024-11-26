// utils/authContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser   
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    getDocs,
    where,
    collection,
    serverTimestamp,
    deleteDoc,
    query,  // Add this import
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase.config';
import { TokenManager } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // Always create base user object first
                    const baseUser = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        emailVerified: firebaseUser.emailVerified,
                        displayName: firebaseUser.displayName
                    };
    
                    // Set initial user state
                    setUser(baseUser);
                    
                    // Handle unverified email case
                    if (!firebaseUser.emailVerified) {
                        setIsAuthenticated(false);
                        setLoading(false);
                        return;
                    }
    
                    // Get additional user data from Firestore
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    const userData = userDoc.data();
    
                    // Get fresh token
                    const token = await firebaseUser.getIdToken(true);
                    TokenManager.setToken(token);
    
                    // Create complete user object
                    const userWithData = {
                        ...baseUser,
                        ...userData,
                        role: userData?.role || 'user'
                    };
    
                    setUser(userWithData);
                    setIsAuthenticated(true);
                    TokenManager.setUser(userWithData);
    
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    TokenManager.clearAuth();
                }
            } catch (err) {
                console.error('Auth state change error:', err);
                setError(err.message);
                setUser(null);
                setIsAuthenticated(false);
                TokenManager.clearAuth();
            } finally {
                setLoading(false);
            }
        });
    
        return () => unsubscribe();
    }, []);

    // Login with email/password
    // Login with email/password
// Modify the existing login function to check for deleted accounts
const login = async (credentials) => {
    try {
        const { email, password } = credentials;

        // Check if email was previously associated with a deleted account
        const deletedAccountsRef = collection(db, 'deletedAccounts');
        const q = query(deletedAccountsRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const deletedAccount = querySnapshot.docs[0].data();
            throw new Error(
                `This account has been deleted on ${deletedAccount.deletedAt.toDate().toLocaleDateString()}. ` +
                'Please use a different email address or contact support.'
            );
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Verify user still exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) {
            // User exists in Auth but not in Firestore - likely deleted
            await signOut(auth);
            throw new Error('This account has been deleted. Please use a different email address.');
        }

        const userData = userDoc.data();
        
        if (!userCredential.user.emailVerified) {
            return {
                user: userCredential.user,
                requiresVerification: true
            };
        }

        await updateDoc(doc(db, 'users', userCredential.user.uid), {
            lastLoginAt: serverTimestamp()
        });

        const token = await userCredential.user.getIdToken(true);
        TokenManager.setToken(token);

        const userWithRole = {
            ...userCredential.user,
            role: userData?.role || 'user',
            ...userData
        };

        setUser(userWithRole);
        setIsAuthenticated(true);
        TokenManager.setUser(userWithRole);
        
        return userWithRole;
    } catch (err) {
        console.error('Login error:', err);
        throw err;
    }
};
    // Google sign in
 // Google sign in
const googleLogin = async () => {
  try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData;
      
      if (!userDoc.exists()) {
          // Create new user document if first time sign in
          userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: 'user',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
          };
          await setDoc(doc(db, 'users', user.uid), userData);
      } else {
          userData = userDoc.data();
          // Update last login
          await updateDoc(doc(db, 'users', user.uid), {
              lastLoginAt: serverTimestamp()
          });
      }

      // Get fresh token
      const token = await user.getIdToken(true);
      TokenManager.setToken(token);

      // Create complete user object with role
      const userWithRole = {
          ...user,
          role: userData.role || 'user',
          ...userData
      };

      // Update local state
      setUser(userWithRole);
      setIsAuthenticated(true);
      TokenManager.setUser(userWithRole);

      return userWithRole;
  } catch (err) {
      console.error('Google login error:', err);
      throw err;
  }
};

const logout = async () => {
    try {
        if (user?.uid) {
            // First check if user still exists in Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                // User was manually deleted from Firestore
                console.log('User account was deleted');
                await signOut(auth);
                setUser(null);
                setIsAuthenticated(false);
                TokenManager.clearAuth();
                return { accountDeleted: true };
            }

            // Normal logout flow
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogoutAt: serverTimestamp()
            });
            
            await signOut(auth);
            setUser(null);
            setIsAuthenticated(false);
            TokenManager.clearAuth();
            return { accountDeleted: false };
        }
        
        // If no user, just clear everything
        await signOut(auth);
        setUser(null);
        setIsAuthenticated(false);
        TokenManager.clearAuth();
        return { accountDeleted: false };
    } catch (err) {
        console.error('Logout error:', err);
        // If there's an error, force logout anyway
        await signOut(auth);
        setUser(null);
        setIsAuthenticated(false);
        TokenManager.clearAuth();
        throw err;
    }
};
   // Send password reset email
  // Register new user
 // Modify the existing register function to check for deleted accounts
 // Modified register function in authContext.js for testing
// In authContext.js

const register = async (userData) => {
    try {
      const { email, password, name } = userData;
  
      console.log('Starting registration process for:', email);
  
      // Check for deleted account status
      console.log('Checking if email was deleted:', email);
      const deletionStatus = await checkIfEmailWasDeleted(email);
      console.log('Deletion status:', deletionStatus);
  
      // If it was deleted, first clean up any existing auth data
      if (deletionStatus.wasDeleted) {
        try {
          // Try to delete any existing Firebase auth account
          const existingUser = await signInWithEmailAndPassword(auth, email, password)
            .then(result => result.user);
          if (existingUser) {
            await deleteUser(existingUser);
          }
        } catch (error) {
          console.log('No existing auth account to clean up or unable to access');
        }
      }
  
      try {
        // Create new Firebase auth account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
  
        // Update profile with name
        await updateProfile(user, {
          displayName: name
        });
  
        // Send verification email
        await sendEmailVerification(user);
  
        // Create or update user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: 'user',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          deletedAt: null, // Clear any previous deletion record
          isDeleted: false // Reset deletion status
        });
  
        console.log('Registration successful for:', email);
        return user;
  
      } catch (authError) {
        console.error('Auth operation error:', authError);
  
        if (authError.code === 'auth/email-already-in-use') {
          try {
            // Try to get the existing user's status
            const existingUserCredential = await signInWithEmailAndPassword(auth, email, 'dummy-password');
            
            if (existingUserCredential.user) {
              throw new Error('This email address is already registered and active. Please use a different email.');
            }
          } catch (signInError) {
            if (signInError.code === 'auth/wrong-password') {
              throw new Error('This email address is already registered. Please use a different email or try logging in.');
            } else {
              // Handle other potential error states
              const errorMessage = signInError.code === 'auth/user-disabled'
                ? 'This account has been disabled. Please contact support.'
                : 'This email address is in an invalid state. Please contact support.';
              throw new Error(errorMessage);
            }
          }
        }
  
        // Handle other registration errors
        const errorMessages = {
          'auth/invalid-email': 'Please enter a valid email address.',
          'auth/operation-not-allowed': 'Email/password registration is not enabled. Please contact support.',
          'auth/weak-password': 'Please choose a stronger password. It should be at least 6 characters.',
          'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
          'auth/too-many-requests': 'Too many attempts. Please try again later.'
        };
  
        throw new Error(errorMessages[authError.code] || authError.message || 'Failed to create account. Please try again.');
      }
  
    } catch (err) {
      console.error('Registration process error:', err);
      
      // Rethrow the error with appropriate message
      if (err.message) {
        throw new Error(err.message);
      } else {
        throw new Error('An unexpected error occurred during registration. Please try again.');
      }
    }
  };

// Verify reset code and reset password

   // Send password reset email
  // In authContext.js
const resetPassword = async (email) => {
    try {
        // Get the current URL for proper redirection
        const actionCodeSettings = {
            url: `${window.location.origin}/reset-password`,
            handleCodeInApp: true
        };

        // Send reset email
        await sendPasswordResetEmail(auth, email, actionCodeSettings);

        // Log success for debugging
        console.log('Reset email sent successfully to:', email);

        return {
            success: true,
            message: 'Password reset email sent successfully'
        };
    } catch (err) {
        console.error('Password reset error:', err);
        
        // Enhanced error handling
        let errorMessage = '';
        switch (err.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
            case 'auth/invalid-continue-uri':
                errorMessage = 'Invalid redirect URL. Please contact support.';
                break;
            case 'auth/unauthorized-continue-uri':
                errorMessage = 'Unauthorized redirect URL. Please contact support.';
                break;
            default:
                errorMessage = 'Failed to send reset email. Please try again.';
                // Log unexpected errors
                console.error('Unexpected error code:', err.code);
        }

        // Create a custom error with the message
        const error = new Error(errorMessage);
        error.code = err.code;
        throw error;
    }
};

const handlePasswordReset = async (oobCode, newPassword) => {
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        return {
            success: true,
            message: 'Password has been reset successfully'
        };
    } catch (err) {
        console.error('Password reset confirmation error:', err);
        let errorMessage = '';
        switch (err.code) {
            case 'auth/expired-action-code':
                errorMessage = 'Reset link has expired. Please request a new one.';
                break;
            case 'auth/invalid-action-code':
                errorMessage = 'Invalid reset link. Please request a new one.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled. Please contact support.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters long.';
                break;
            default:
                errorMessage = 'Failed to reset password. Please try again.';
        }
        throw new Error(errorMessage);
    }
};

// Verify reset code and reset password
const confirmPasswordReset = async (oobCode, newPassword) => {
    try {
        // First verify the action code
        await verifyPasswordResetCode(auth, oobCode);
        
        // Then confirm the password reset
        await confirmPasswordReset(auth, oobCode, newPassword);
        
        return {
            success: true,
            message: 'Password has been reset successfully'
        };
    } catch (err) {
        console.error('Password reset confirmation error:', err);
        let errorMessage;
        switch (err.code) {
            case 'auth/expired-action-code':
                errorMessage = 'The password reset link has expired.';
                break;
            case 'auth/invalid-action-code':
                errorMessage = 'The password reset link is invalid.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters.';
                break;
            default:
                errorMessage = 'Failed to reset password. Please try again.';
        }
        throw new Error(errorMessage);
    }
};

// Verify password reset code
const verifyResetCode = async (oobCode) => {
    try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        return {
            success: true,
            email
        };
    } catch (err) {
        console.error('Reset code verification error:', err);
        let errorMessage;
        switch (err.code) {
            case 'auth/expired-action-code':
                errorMessage = 'The password reset link has expired.';
                break;
            case 'auth/invalid-action-code':
                errorMessage = 'The password reset link is invalid.';
                break;
            default:
                errorMessage = 'Invalid reset link. Please request a new one.';
        }
        throw new Error(errorMessage);
    }
};



    // Update user profile
    const updateUserProfile = async (updateData) => {
        try {
            const { displayName } = updateData;
            
            if (!auth.currentUser) {
                throw new Error('No user is currently logged in');
            }

            // Update authentication profile
            await updateProfile(auth.currentUser, {
                displayName: displayName || auth.currentUser.displayName
            });

            // Update Firestore document
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                displayName: displayName || auth.currentUser.displayName,
                updatedAt: serverTimestamp()
            });

            // Update local user state
            setUser(prevUser => ({
                ...prevUser,
                displayName: displayName || prevUser.displayName
            }));

            return auth.currentUser;
        } catch (err) {
            console.error('Profile update error:', err);
            throw err;
        }
    };

    // Change password
    const changePassword = async (currentPassword, newPassword) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user is currently logged in');

            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Change password
            await updatePassword(user, newPassword);
        } catch (err) {
            console.error('Password change error:', err);
            throw err;
        }
    };

    // Resend verification email
    const resendVerificationEmail = async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user is currently logged in');
            await sendEmailVerification(user);
        } catch (err) {
            console.error('Verification email error:', err);
            throw err;
        }
    };

    // Get current user data
    const getCurrentUser = async () => {
        try {
            if (!user?.uid) return null;
            
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            return userDoc.data();
        } catch (err) {
            console.error('Get user error:', err);
            throw err;
        }
    };

    const storeDeletedAccountInfo = async (userId, userData) => {
        try {
            await setDoc(doc(db, 'deletedAccounts', userId), {
                email: userData.email,
                displayName: userData.displayName,
                deletedAt: serverTimestamp(),
                lastLoginAt: userData.lastLoginAt || null,
                lastLogoutAt: userData.lastLogoutAt || null,
                deletionReason: userData.deletionReason || null,
                role: userData.role || 'user'
            });
        } catch (err) {
            console.error('Error storing deleted account info:', err);
            throw err;
        }
    };
    
 // Modified checkIfEmailWasDeleted function for testing
const checkIfEmailWasDeleted = async (email) => {
    console.log('Checking email:', email); // Debug log
    
    try {
        const deletedAccountsRef = collection(db, 'deletedAccounts');
        const q = query(deletedAccountsRef, where('email', '==', email));
        
        console.log('Executing query...'); // Debug log
        const querySnapshot = await getDocs(q);
        console.log('Query result size:', querySnapshot.size); // Debug log
        
        if (!querySnapshot.empty) {
            const deletedAccount = querySnapshot.docs[0].data();
            console.log('Found deleted account:', deletedAccount); // Debug log
            return {
                wasDeleted: true,
                deletedAt: deletedAccount.deletedAt,
                deletionReason: deletedAccount.deletionReason
            };
        }
        
        console.log('No deleted account found'); // Debug log
        return { wasDeleted: false };
    } catch (err) {
        console.error('Error checking deleted email:', err);
        // Return false instead of throwing to prevent blocking registration
        return { wasDeleted: false, error: err.message };
    }
};

    
    // Delete account with tracking
    const deleteAccount = async (currentPassword, reason = '') => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('No user is currently logged in');

            // Get current user data before deletion
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userData = userDoc.data();

            // Re-authenticate user before deletion
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Store deletion info first
            await storeDeletedAccountInfo(currentUser.uid, {
                ...userData,
                deletionReason: reason
            });

            // Delete user document from users collection
            await deleteDoc(doc(db, 'users', currentUser.uid));

            // Delete Firebase Auth account
            await deleteUser(currentUser);

            // Clear local auth state
            setUser(null);
            setIsAuthenticated(false);
            TokenManager.clearAuth();

            return true;
        } catch (err) {
            console.error('Account deletion error:', err);
            throw err;
        }
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };
    
    const value = {
        user,
        loading,
        error,
        isAuthenticated,
        setError,
        login,
        register,
        googleLogin,
        logout,
        isAdmin,    
        handlePasswordReset,
        resetPassword,
        updateUserProfile,
        changePassword,
        resendVerificationEmail,
        getCurrentUser,
        deleteAccount,  // Add this
        checkIfEmailWasDeleted  // Add this if you want to expose it
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};