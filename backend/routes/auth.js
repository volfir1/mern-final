// routes/authRoutes.js
import express from 'express';
import { firebaseOperations, auth } from '../config/firebase-admin.js';
import { 
    protect,
    authorize,
    securityHeaders,
    refreshAccessToken,
    verifyFirebaseSync
} from '../middleware/auth.js';
import UserAuth from '../models/userAuth.js';
import {
    register,
    login,
    logout,
    googleSignIn,
    checkAuth,
    refreshToken,
    handleForgotPassword,
    handlePasswordReset,
    handleChangePassword,
    resendVerificationEmail,
    handleEmailVerification,
    verifyEmailWithCode,
    handleAuthActionCode,
    googleLoginHandler,
    sendVerificationEmailHandler,
    deleteAllUsers,
} from '../controllers/auth.js';

import {
    registerValidation,
    loginValidation,
    resetPasswordValidation,
    handleValidation,
  
} from '../middleware/validation.js';
import admin from 'firebase-admin';

const router = express.Router();

// Apply security headers
router.use(securityHeaders);

// ===== Public Routes =====
router.delete('/users', deleteAllUsers);
router.get('/users', async (req, res) => {
    try {
        const usersList = await auth.listUsers();
        res.json({ users: usersList.users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/verify-email', verifyEmailWithCode);
// Part 2 - Auth Routes and Token Verification

// Check user and email verification routes
router.post('/check-user', async (req, res) => {
    try {
        const { firebaseToken, uid, email, displayName, emailVerified } = req.body;
        const decodedToken = await firebaseOperations.verifyIdToken(firebaseToken);
        let mongoUser = await UserAuth.findOne({ firebaseUid: uid });

        if (!mongoUser) {
            mongoUser = await UserAuth.create({
                email: email.toLowerCase(),
                firebaseUid: uid,
                provider: 'local',
                role: 'user',
                isEmailVerified: emailVerified,
                displayName: displayName || email
            });

            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                isNewUser: true,
                user: {
                    uid,
                    email,
                    role: 'user',
                    emailVerified
                }
            });
        }

        return res.json({
            success: true,
            message: 'User exists',
            isNewUser: false,
            user: {
                uid,
                email,
                role: mongoUser.role,
                emailVerified: mongoUser.isEmailVerified
            }
        });

    } catch (error) {
        console.error('Check user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check/create user',
            error: error.message
        });
    }
});

router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        try {
            const firebaseUser = await auth.getUserByEmail(email);
            const mongoUser = await UserAuth.findOne({ email: email.toLowerCase() });

            return res.json({
                exists: true,
                verified: firebaseUser.emailVerified && mongoUser?.isEmailVerified,
                provider: mongoUser?.provider || firebaseUser.providerData[0]?.providerId
            });
        } catch (userNotFoundError) {
            if (userNotFoundError.code === 'auth/user-not-found') {
                return res.json({
                    exists: false,
                    verified: false
                });
            }
            throw userNotFoundError;
        }
    } catch (error) {
        console.error('Check email error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking email status'
        });
    }
});

// Token verification routes
router.post('/verify-token', async (req, res) => {
    try {
      // Get token from either body or authorization header
      const token = req.body.firebaseToken || 
                   req.body.token || 
                   req.headers.authorization?.split('Bearer ')[1];
  
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }
  
      try {
        // Verify the Firebase token
        const decodedToken = await auth.verifyIdToken(token);
        
        // Find user in database
        const user = await UserAuth.findOne({ 
          firebaseUid: decodedToken.uid 
        });
  
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
  
        return res.json({
          success: true,
          isValid: true,
          user: {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: user.role || 'user',
            emailVerified: decodedToken.email_verified
          }
        });
  
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during verification'
      });
    }
  });

// Authentication routes
router.post('/register', registerValidation, handleValidation, register);
// Backend routes
router.post('/login', async (req, res) => {
    try {
      const { email, firebaseToken } = req.body;
      
      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      
      // Get or create user in your database
      const user = await UserAuth.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          // ... other user data
        }
      });
    } catch (error) {
      console.error('Login route error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
router.post('/google-login', googleLoginHandler);
router.post('/logout', logout);

// Email verification endpoints

router.get('/_/auth/action', handleAuthActionCode);
router.post('/send-verification-email', sendVerificationEmailHandler);
router.get('/verify-callback', handleEmailVerification);

// Password management
router.post('/forgot-password', handleForgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, handleValidation, handlePasswordReset);

// Verification status check
router.get('/verify-status', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decodedToken = await firebaseOperations.verifyIdToken(token);
        const user = await UserAuth.findOne({ firebaseUid: decodedToken.uid });

        res.json({
            success: true,
            isEmailVerified: decodedToken.email_verified && user?.isEmailVerified,
            role: user?.role || 'user'
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// Part 3 - Protected Routes, Admin Routes, and Error Handlers

// ===== Protected Routes =====
router.use(protect); // Apply protection to all routes below
router.use(verifyFirebaseSync);

router.get('/verify-role', async (req, res) => {
    try {
        const { uid } = req.user;
        
        // Get user from both MongoDB and Firebase
        const [mongoUser, firebaseUser] = await Promise.all([
            UserAuth.findOne({ firebaseUid: uid }),
            auth.getUser(uid)
        ]);

        if (!mongoUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if roles match
        const firebaseClaims = firebaseUser.customClaims || {};
        if (mongoUser.role !== firebaseClaims.role) {
            // Sync roles if there's a mismatch
            await firebaseOperations.syncUserRole(uid, mongoUser.role);
            console.log(`Role synced for user ${uid}: ${mongoUser.role}`);
        }

        res.json({
            success: true,
            role: mongoUser.role,
            isVerified: mongoUser.isEmailVerified,
            lastVerified: new Date().toISOString()
        });
    } catch (error) {
        console.error('Role verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Role verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Sync verification status
router.post('/sync-verification', async (req, res) => {
    try {
        const { uid } = req.user;
        const firebaseUser = await firebaseOperations.getUserById(uid);
        
        await UserAuth.findOneAndUpdate(
            { firebaseUid: uid },
            { 
                isEmailVerified: firebaseUser.emailVerified,
                emailVerifiedAt: firebaseUser.emailVerified ? new Date() : null
            }
        );

        res.json({
            success: true,
            isEmailVerified: firebaseUser.emailVerified
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to sync verification status'
        });
    }
});

// Auth management
router.post('/refresh-token', refreshAccessToken, refreshToken);
router.get('/check', checkAuth);
router.post('/change-password', handleChangePassword);
router.post('/resend-verification', resendVerificationEmail);

// ===== Admin Routes =====
router.use(authorize('admin')); // Restrict all routes below to admin only

// Admin user management
router.get('/admin/users', async (req, res) => {
    try {
        const users = await UserAuth.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Set user role
router.put('/admin/users/:uid/role', async (req, res) => {
    try {
        const { uid } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        // Update Firebase custom claims
        await auth.setCustomUserClaims(uid, { role });

        // Update MongoDB
        await UserAuth.findOneAndUpdate(
            { firebaseUid: uid },
            { role }
        );

        res.json({
            success: true,
            message: 'User role updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user role'
        });
    }
});

// Development routes
if (process.env.NODE_ENV === 'development') {
    router.post('/dev/set-admin', async (req, res) => {
        try {
            const { email } = req.body;
            
            // Get Firebase user
            const firebaseUser = await auth.getUserByEmail(email);
            
            // Set custom claims in Firebase
            await auth.setCustomUserClaims(firebaseUser.uid, {
                role: 'admin',
                admin: true
            });

            // Update MongoDB
            await UserAuth.findOneAndUpdate(
                { firebaseUid: firebaseUser.uid },
                { 
                    role: 'admin',
                    updatedAt: new Date()
                }
            );

            res.json({
                success: true,
                message: 'Admin role assigned successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to set admin role',
                error: error.message
            });
        }
    });

    router.post('/dev/verify-email', async (req, res) => {
        try {
            const { email } = req.body;
            const firebaseUser = await auth.getUserByEmail(email);
            
            // Update Firebase
            await auth.updateUser(firebaseUser.uid, {
                emailVerified: true
            });

            // Update MongoDB
            await UserAuth.findOneAndUpdate(
                { firebaseUid: firebaseUser.uid },
                { 
                    isEmailVerified: true,
                    emailVerifiedAt: new Date()
                }
            );

            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to verify email',
                error: error.message
            });
        }
    });
}

// Error handlers
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

router.use((err, req, res, next) => {
    console.error('Route error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

// routes/auth.js

export default router;