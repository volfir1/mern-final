// routes/authRoutes.js
import express from 'express';
import { auth } from '../config/firebase-admin.js';
import authController from '../controllers/auth.js';
import { createUploadMiddleware } from '../middleware/multer.js';
import { verifyGoogleToken } from '../middleware/googleAuth.js';
import { firebaseProtect } from '../middleware/firebaseAuth.js';
import UserAuth from '../models/userAuth.js';
import UserProfile from '../models/userProfile.js';
const router = express.Router();

// Middleware helpers
const asyncHandler = fn => (req, res, next) => {
  if (typeof fn !== 'function') {
    throw new Error(`Expected a function but got: ${typeof fn}`);
  }
  return Promise.resolve(fn(req, res, next)).catch(next);
};

const validateContentType = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
    return res.status(415).json({
      success: false,
      message: 'Content-Type must be application/json or multipart/form-data'
    });
  }
  next();
};

// Role check middleware
const checkRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== role) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  }

  next();
};

// Development Tools
if (process.env.NODE_ENV === 'development') {
  router.get('/dev/health', (req, res) => {
    res.json({
      success: true,
      message: 'Auth service running',
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    });
  });

  router.delete('/dev/delete-all-users', asyncHandler(authController.deleteAllUsers));
}

// Public Authentication Routes
router.post('/register',
  validateContentType,
  createUploadMiddleware.register(),
  asyncHandler(authController.register)
);

router.post('/login',
  validateContentType,
  asyncHandler(authController.login)
);

router.post('/logout',
  asyncHandler(authController.logout)
);

// Google Authentication Routes
router.post('/google/signin',
  validateContentType,
  verifyGoogleToken,
  asyncHandler(authController.googleSignIn)
);

router.post('/google/link',
  process.env.NODE_ENV === 'development' ? (req, res, next) => next() : firebaseProtect,
  verifyGoogleToken,
  asyncHandler(authController.linkGoogleAccount)
);

router.post('/google/unlink',
  process.env.NODE_ENV === 'development' ? (req, res, next) => next() : firebaseProtect,
  asyncHandler(authController.unlinkGoogleAccount)
);

// Enhanced Email Verification Routes
router.get('/verify-email',
  asyncHandler(authController.handleVerificationLink)
);

router.get('/verify-email/callback',
  asyncHandler(authController.handleVerificationLink)
);

router.get('/verify-email/complete', asyncHandler(async (req, res) => {
  try {
    const { oobCode, email } = req.query;

    if (!oobCode || !email) {
      return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=missing_parameters`);
    }

    // 1. Verify the action code
    const actionCodeInfo = await auth.checkActionCode(oobCode);
    const userEmail = actionCodeInfo.data.email;

    if (userEmail.toLowerCase() !== email.toLowerCase()) {
      return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=email_mismatch`);
    }

    // 2. Apply the verification
    await auth.applyActionCode(oobCode);
    
    // 3. Get Firebase user and update their status
    const firebaseUser = await auth.getUserByEmail(userEmail);
    await auth.updateUser(firebaseUser.uid, { emailVerified: true });

    // 4. Update MongoDB user with session
    const session = await UserAuth.startSession();
    try {
      await session.withTransaction(async () => {
        const user = await UserAuth.findOneAndUpdate(
          { email: userEmail.toLowerCase() },
          { 
            isEmailVerified: true,
            verifiedAt: new Date(),
            status: 'active',
            lastUpdateTimestamp: new Date()
          },
          { session, new: true }
        );

        if (!user) {
          throw new Error('User not found in database');
        }

        // Log the verification
        await logEmailActivity(
          user._id,
          userEmail,
          'email_verification_success',
          {
            method: 'link',
            verifiedAt: new Date()
          }
        );
      });

      await session.commitTransaction();
      // 5. Redirect to login with success message
      return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true&email=${encodeURIComponent(userEmail)}`);

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Verification completion error:', error);
    
    if (error.code === 'auth/invalid-action-code') {
      return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=invalid_code`);
    }

    return res.redirect(
      `${process.env.FRONTEND_URL}/verify-email?error=verification_failed&message=${encodeURIComponent(error.message)}`
    );
  }
}));

router.get('/verify/status',
  asyncHandler(async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await UserAuth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        email,
        isVerified: user.isEmailVerified,
        status: user.status,
        verifiedAt: user.verifiedAt,
        lastVerificationAttempt: user.lastVerificationEmailSent
      }
    });
  })
);

router.post('/verify/resend',
  validateContentType,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await UserAuth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email/complete?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true
    };

    const verificationLink = await auth.generateEmailVerificationLink(
      email,
      actionCodeSettings
    );

    const { sendVerificationEmail } = await import('../utils/email.js');
    await sendVerificationEmail(email, verificationLink);

    await UserAuth.updateOne(
      { email },
      { 
        lastVerificationEmailSent: new Date(),
        status: 'pending'
      }
    );

    return res.json({
      success: true,
      message: 'Verification email resent successfully',
      data: {
        email,
        verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
      }
    });
  })
);

router.get('/verify/sync',
  asyncHandler(authController.syncVerificationStatus)
);

// Password Management Routes
router.post('/password/reset-request',
  validateContentType,
  asyncHandler(authController.resetPasswordRequest)
);

router.post('/password/reset-confirm',
  validateContentType,
  asyncHandler(authController.confirmPasswordReset)
);

// Protected Routes
if (process.env.NODE_ENV === 'development') {
  // Unprotected in development
  router.get('/profile',
    asyncHandler(authController.getProfile)
  );

  router.patch('/profile',
    validateContentType,
    createUploadMiddleware.profile(),
    asyncHandler(authController.updateProfile)
  );

  router.post('/password/change',
    validateContentType,
    asyncHandler(authController.changePassword)
  );

  router.post('/invalidate-sessions',
    asyncHandler(authController.invalidateAllSessions)
  );

  router.delete('/account',
    validateContentType,
    asyncHandler(authController.deleteUser)
  );

  router.get('/admin/users', asyncHandler(async (req, res) => {
    const users = await auth.listUsers();
    res.json({
      success: true,
      data: {
        users: users.users.map(user => ({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          provider: user.providerData[0]?.providerId || 'email'
        }))
      }
    });
  }));

} else {
  // Protected in production
  router.get('/profile',
    firebaseProtect,
    asyncHandler(authController.getProfile)
  );

  router.patch('/profile',
    firebaseProtect,
    validateContentType,
    createUploadMiddleware.profile(),
    asyncHandler(authController.updateProfile)
  );

  router.post('/password/change',
    firebaseProtect,
    validateContentType,
    asyncHandler(authController.changePassword)
  );

  router.post('/invalidate-sessions',
    firebaseProtect,
    asyncHandler(authController.invalidateAllSessions)
  );

  router.delete('/account',
    firebaseProtect,
    validateContentType,
    asyncHandler(authController.deleteUser)
  );

  router.get('/admin/users',
    firebaseProtect,
    checkRole('admin'),
    asyncHandler(async (req, res) => {
      const users = await auth.listUsers();
      res.json({
        success: true,
        data: {
          users: users.users.map(user => ({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            provider: user.providerData[0]?.providerId || 'email'
          }))
        }
      });
    })
  );
}

// Development Routes
if (process.env.NODE_ENV === 'development') {
  router.get('/dev/health', (req, res) => {
    res.json({
      success: true,
      message: 'Auth service running',
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    });
  });

  // Keep the delete all users route
  router.delete('/delete-all-users', asyncHandler(async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        throw new AuthError('This operation is only available in development mode', 403);
      }

      console.log('Starting bulk user deletion process...');

      // 1. Get all users with their profiles
      const users = await UserAuth.find({}).populate('profile');
      
      const deletionResults = {
        total: users.length,
        success: 0,
        failed: 0,
        details: []
      };

      // 2. Delete users one by one
      for (const user of users) {
        try {
          if (user.firebaseUid) {
            try {
              await auth.deleteUser(user.firebaseUid);
              console.log(`Firebase user deleted: ${user.email}`);
            } catch (firebaseError) {
              if (firebaseError.code !== 'auth/user-not-found') {
                console.error(`Firebase deletion error for ${user.email}:`, firebaseError);
                throw firebaseError;
              }
            }
          }

          if (user.profile) {
            await UserProfile.findByIdAndDelete(user.profile._id);
            console.log(`Profile deleted for user: ${user.email}`);
          }

          await UserAuth.findByIdAndDelete(user._id);

          deletionResults.success++;
          deletionResults.details.push({
            email: user.email,
            status: 'success',
            message: 'User deleted successfully'
          });

        } catch (userDeletionError) {
          deletionResults.failed++;
          deletionResults.details.push({
            email: user.email,
            status: 'failed',
            error: userDeletionError.message
          });
          
          console.error(`Error deleting user ${user.email}:`, userDeletionError);
        }
      }

      // 3. Clean up orphaned profiles
      const orphanedProfiles = await UserProfile.find({
        user: { $nin: users.map(u => u._id) }
      });

      if (orphanedProfiles.length > 0) {
        await UserProfile.deleteMany({
          _id: { $in: orphanedProfiles.map(p => p._id) }
        });
      }

      // 4. Check remaining Firebase users
      try {
        const remainingFirebaseUsers = await auth.listUsers();
        if (remainingFirebaseUsers.users.length > 0) {
          console.log('Cleaning up remaining Firebase users...');
          await Promise.all(
            remainingFirebaseUsers.users.map(user =>
              auth.deleteUser(user.uid).catch(error => {
                console.error(`Failed to delete Firebase user ${user.email}:`, error);
              })
            )
          );
        }
      } catch (firebaseListError) {
        console.error('Error checking remaining Firebase users:', firebaseListError);
      }

      return res.status(200).json({
        status: 'success',
        message: 'All users deleted successfully',
        data: {
          ...deletionResults,
          orphanedProfilesDeleted: orphanedProfiles.length
        }
      });

    } catch (error) {
      console.error('Bulk deletion error:', error);
      throw error;
    }
  }));

  // Keep the single user delete route
  router.delete('/users/:uid', asyncHandler(async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await UserAuth.findOne({ firebaseUid: uid }).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      try {
        await auth.deleteUser(uid);
      } catch (firebaseError) {
        console.error('Firebase user deletion error:', firebaseError);
      }

      if (user.profile) {
        await UserProfile.findByIdAndDelete(user.profile);
      }

      await UserAuth.findByIdAndDelete(user._id);

      return res.status(200).json({
        status: 'success',
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('User deletion error:', error);
      throw error;
    }
  }));
}

// Global Error Handler
router.use((err, req, res, next) => {
  console.error('Auth Route Error:', {
    path: req.path,
    method: req.method,
    error: {
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });

  if (err.code?.startsWith('auth/')) {
    const statusCodes = {
      'auth/user-not-found': 404,
      'auth/email-already-exists': 409,
      'auth/invalid-credential': 401,
      'auth/wrong-password': 401,
      'auth/email-already-in-use': 409,
      'auth/weak-password': 400,
      'auth/invalid-verification-code': 400,
      'auth/invalid-action-code': 400,
      'auth/invalid-session': 401,
      'auth/session-expired': 401,
      'auth/requires-recent-login': 403,
      'auth/id-token-expired': 401,
      'auth/id-token-revoked': 401,
      'auth/invalid-id-token': 401,
      'auth/invalid-oauth-credentials': 401,
      'auth/invalid-oauth-provider': 400,
      'auth/account-exists-with-different-credential': 400
    };

    return res.status(statusCodes[err.code] || 400).json({
      success: false,
      message: err.message.replace('auth/', '').replace(/-/g, ' '),
      code: err.code
    });
  }

  if (err.name === 'GoogleAuthError') {
    return res.status(err.statusCode || 401).json({
      success: false,
      message: err.message,
      code: 'google_auth_error'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle all other errors
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
});

// Add the new routes for handling email verification completion
router.get('/verify-email/complete', asyncHandler(async (req, res) => {
  try {
    const { oobCode, email } = req.query;

    if (!oobCode || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // 1. Verify the action code
    const actionCodeInfo = await auth.checkActionCode(oobCode);
    const userEmail = actionCodeInfo.data.email;

    if (userEmail.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email mismatch'
      });
    }

    // 2. Apply the verification
    await auth.applyActionCode(oobCode);
    
    // 3. Get Firebase user
    const firebaseUser = await auth.getUserByEmail(userEmail);

    // 4. Update MongoDB user
    const user = await UserAuth.findOneAndUpdate(
      { email: userEmail.toLowerCase() },
      { 
        isEmailVerified: true,
        verifiedAt: new Date(),
        status: 'active',
        lastUpdateTimestamp: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.email,
        isVerified: true,
        status: 'active',
        verifiedAt: user.verifiedAt
      }
    });

  } catch (error) {
    console.error('Verification completion error:', error);
    
    if (error.code === 'auth/invalid-action-code') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    throw error;
  }
}));

// Add route to check verification status with Firebase sync
router.get('/verify/check', asyncHandler(async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    // Check both Firebase and MongoDB
    const [firebaseUser, mongoUser] = await Promise.all([
      auth.getUserByEmail(email),
      UserAuth.findOne({ email: email.toLowerCase() })
    ]);

    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Sync verification status if different
    if (firebaseUser.emailVerified !== mongoUser.isEmailVerified) {
      await UserAuth.updateOne(
        { email: email.toLowerCase() },
        { 
          isEmailVerified: firebaseUser.emailVerified,
          status: firebaseUser.emailVerified ? 'active' : 'pending',
          verifiedAt: firebaseUser.emailVerified ? new Date() : null,
          lastUpdateTimestamp: new Date()
        }
      );
    }

    return res.json({
      success: true,
      data: {
        email,
        isVerified: firebaseUser.emailVerified,
        status: firebaseUser.emailVerified ? 'active' : 'pending',
        verifiedAt: mongoUser.verifiedAt,
        wasSync: firebaseUser.emailVerified !== mongoUser.isEmailVerified
      }
    });

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found in Firebase'
      });
    }
    throw error;
  }
}));

export default router;