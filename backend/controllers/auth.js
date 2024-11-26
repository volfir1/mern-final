  // auth.js
  import { auth, db, adminSDK } from '../config/firebase-admin.js';
  import UserAuth from '../models/userAuth.js';
  import EmailLog from '../models/emaillog.js';
  import {
  generateToken,
  generateRefreshToken,
  setTokenCookie,
  clearAuthCookies,
  } from '../utils/jwtToken.js';
  import AuthSyncService from '../services/authSync.js';
  import UserProfile from '../models/userProfile.js';
  import sendVerificationEmail from '../utils/email.js'; 
  class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
  }

  const validateInput = (data) => {
    const errors = [];
    
    // Check required fields
    if (!data.email) errors.push('Email is required');
    if (!data.password) errors.push('Password is required');
    if (!data.firstName) errors.push('First name is required');
    if (!data.lastName) errors.push('Last name is required');

    // Validate email format
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Validate password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
    if (data.password && !passwordRegex.test(data.password)) {
      errors.push('Password must contain at least one uppercase letter, lowercase letter, number, and special character');
    }

    // Validate phone number if provided
    if (data.phoneNumber) {
      const cleanPhone = data.phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        errors.push('Invalid phone number format');
      }
    }

    return errors;
  };
  const logEmailActivity = async (userId, email, type, extraData = {}) => {
    try {
      const emailLog = new EmailLog({
        userId: userId || null,
        email: email || 'unknown',
        type,
        metadata: extraData,
        timestamp: new Date()
      });
      await emailLog.save();
    } catch (error) {
      console.error('Email logging error:', error);
    }
  };


  const verificationOperations = {
    async verifyAndUpdateStatus(email, oobCode, session = null) {
      try {
          console.log('Starting verification process for:', email);

          // 1. Firebase verification
          const firebaseAuth = auth();
          const actionCodeInfo = await firebaseAuth.checkActionCode(oobCode);
          const userEmail = actionCodeInfo.data.email;

          // 2. Apply verification code
          await firebaseAuth.applyActionCode(oobCode);
          const firebaseUser = await firebaseAuth.getUserByEmail(userEmail);

          // 3. Force update Firebase user
          await firebaseAuth.updateUser(firebaseUser.uid, {
              emailVerified: true
          });

          // 4. Update MongoDB with session if provided
          const updateQuery = {
              isEmailVerified: true,
              verifiedAt: new Date(),
              status: 'active',
              lastUpdateTimestamp: new Date()
          };

          const updateOptions = { 
              new: true,
              ...(session && { session })
          };

          const updatedUser = await UserAuth.findOneAndUpdate(
              { email: userEmail.toLowerCase() },
              updateQuery,
              updateOptions
          );

          if (!updatedUser) {
              throw new Error('User not found in database');
          }

          // 5. Log verification success
          await logEmailActivity(updatedUser._id, userEmail, 'verification_success', {
              method: 'link',
              verifiedAt: new Date()
          });

          console.log('Verification completed successfully for:', email);

          return { 
              success: true, 
              user: updatedUser,
              message: 'Email verified successfully'
          };

      } catch (error) {
          console.error('Verification error:', error);
          throw error;
      }
  },

  async syncVerificationStatus(email) {
    try {
        const [firebaseUser, mongoUser] = await Promise.all([
            auth().getUserByEmail(email),
            UserAuth.findOne({ email })
        ]);

        if (!mongoUser) {
            throw new Error('User not found in MongoDB');
        }

        // If Firebase shows verified but MongoDB doesn't, sync it
        if (firebaseUser.emailVerified && !mongoUser.isEmailVerified) {
            const updatedUser = await UserAuth.findByIdAndUpdate(
                mongoUser._id,
                {
                    isEmailVerified: true,
                    verifiedAt: new Date(),
                    status: 'active',
                    lastUpdateTimestamp: new Date()
                },
                { new: true }
            );

            await logEmailActivity(mongoUser._id, email, 'verification_synced');
            return { synced: true, user: updatedUser };
        }

        return { synced: false, user: mongoUser };
    } catch (error) {
        console.error('Sync verification status error:', error);
        throw error;
    }
}
  };

  const authController = {
  // Core Authentication
  register: async (req, res) => {
    const session = await UserAuth.startSession();
    session.startTransaction();

    try {
      const { email, password, firstName, lastName, phoneNumber } = req.body;

      // Create Firebase user
      const userRecord = await auth.createUser({
        email: email.toLowerCase(),
        password,
        emailVerified: false,
        displayName: `${firstName} ${lastName}`,
      });

      // Create UserAuth record
      const userAuth = await UserAuth.create([{
        email: email.toLowerCase(),
        password,
        firebaseUid: userRecord.uid,
        provider: 'local',
        role: 'user',
        status: 'pending',
        isActive: true,
        isEmailVerified: false,
        lastVerificationEmailSent: new Date()
      }], { session });

      // Create UserProfile
      const userProfile = await UserProfile.create([{
        user: userAuth[0]._id,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        phoneNumber
      }], { session });

      // Update UserAuth with profile reference
      await UserAuth.findByIdAndUpdate(
        userAuth[0]._id,
        { profile: userProfile[0]._id },
        { session }
      );

      // Generate verification link
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL}/verify-email/complete?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true
      };

      const verificationLink = await auth.generateEmailVerificationLink(
        email,
        actionCodeSettings
      );

      // Send verification email using the imported function
      await sendVerificationEmail(email, verificationLink);

      await session.commitTransaction();

      return res.status(201).json({
        status: 'success',
        message: 'Registration successful. Please check your email for verification.',
        data: {
          user: {
            id: userAuth[0]._id,
            email: userAuth[0].email,
            status: 'pending',
            isVerified: false
          },
          ...(process.env.NODE_ENV === 'development' && { verificationLink })
        }
      });

    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      
      console.error('Registration error:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    } finally {
      await session.endSession();
    }
  },
  



  verifyEmail: async (req, res) => {
    try {
      const { oobCode, email } = req.query;

      if (!oobCode || !email) {
        return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=missing_parameters`);
      }

      // Check action code
      const actionCodeInfo = await auth.checkActionCode(oobCode);
      
      // Verify email matches
      if (actionCodeInfo.data.email.toLowerCase() !== email.toLowerCase()) {
        throw new Error('Email mismatch in verification');
      }

      // Apply verification code
      await auth.applyActionCode(oobCode);
      
      // Get Firebase user
      const firebaseUser = await auth.getUserByEmail(email);
      
      // Update Firebase user
      await auth.updateUser(firebaseUser.uid, {
        emailVerified: true
      });

      // Update MongoDB user
      const updatedUser = await UserAuth.findOneAndUpdate(
        { email: email.toLowerCase() },
        { 
          isEmailVerified: true,
          verifiedAt: new Date(),
          status: 'active',
          lastUpdateTimestamp: new Date()
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('User not found in database');
      }

      // Update Realtime Database if available
      if (db) {
        await db.ref(`users/${firebaseUser.uid}`).update({
          email,
          emailVerified: true,
          updatedAt: adminSDK.database.ServerValue.TIMESTAMP
        });
      }

      return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true&email=${encodeURIComponent(email)}`);

    } catch (error) {
      console.error('Email verification error:', error);
      
      if (error.code === 'auth/invalid-action-code') {
        return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=invalid_link`);
      }

      return res.redirect(
        `${process.env.FRONTEND_URL}/verify-email?error=verification_failed&message=${encodeURIComponent(error.message)}`
      );
    }
  },


  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await UserAuth.findOne({ email })
        .select('+password')
        .populate('profile', 'firstName lastName displayName');

      if (!user || !(await user.comparePassword(password))) {
        throw new AuthError('Invalid email or password', 401);
      }

      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      setTokenCookie(res, accessToken, refreshToken);

      return res.status(200).json({
        status: 'success',
        data: {
          user: {
            email: user.email,
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            isVerified: user.isEmailVerified
          },
          accessToken
        }
      });
    } catch (error) {
      throw new AuthError(error.message, error.statusCode || 500);
    }
  },


  logout: async (req, res) => {
    try {
      clearAuthCookies(res);
      return res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      throw new AuthError(error.message, 500);
    }
  },

  
  checkVerificationStatus: async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        throw new AuthError('Email is required', 400);
      }

      const { synced, user } = await verificationOperations.syncVerificationStatus(email);

      return res.status(200).json({
        status: 'success',
        data: {
          email,
          isVerified: user.isEmailVerified,
          verifiedAt: user.verifiedAt,
          lastVerificationAttempt: user.lastVerificationEmailSent,
          wasSync: synced
        }
      });
    } catch (error) {
      throw new AuthError(error.message, error.statusCode || 500);
    }
  },
      // Add verification handler
    // In controllers/auth.js



    handleVerificationLink: async (req, res) => {
      const session = await UserAuth.startSession();
      session.startTransaction();
  
      try {
          const { email, oobCode } = req.query;
          console.log('Handling verification with:', { email, oobCode });
  
          if (!oobCode || !email) {
              return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=missing_parameters`);
          }
  
          // Fix: Use auth().checkActionCode instead of auth.checkActionCode
          const actionCodeInfo = await auth().checkActionCode(oobCode);
          const userEmail = actionCodeInfo.data.email;
  
          if (userEmail.toLowerCase() !== email.toLowerCase()) {
              throw new Error('Email mismatch');
          }
  
          // Fix: Use auth() for all Firebase operations
          await auth().applyActionCode(oobCode);
          const firebaseUser = await auth().getUserByEmail(userEmail);
          await auth().updateUser(firebaseUser.uid, {
              emailVerified: true
          });
  
          // Update MongoDB
          const updatedUser = await UserAuth.findOneAndUpdate(
              { email: userEmail.toLowerCase() },
              { 
                  isEmailVerified: true,
                  verifiedAt: new Date(),
                  status: 'active',
                  lastUpdateTimestamp: new Date()
              },
              { session, new: true }
          );
  
          if (!updatedUser) {
              throw new Error('User not found in database');
          }
  
          // Log verification
          await logEmailActivity(
              updatedUser._id,
              userEmail,
              'email_verification_success',
              {
                  method: 'link',
                  verifiedAt: new Date()
              }
          );
  
          await session.commitTransaction();
          return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true&email=${encodeURIComponent(userEmail)}`);
  
      } catch (error) {
          await session.abortTransaction();
          console.error('Verification error:', error);
  
          if (error.code === 'auth/invalid-action-code') {
              return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=invalid_link`);
          }
  
          return res.redirect(
              `${process.env.FRONTEND_URL}/verify-email?error=verification_failed&message=${encodeURIComponent(error.message)}`
          );
      } finally {
          await session.endSession();
      }
  },

      syncVerificationStatus: async (req, res) => {
        try {
          const { email } = req.query;
          
          if (!email) {
            throw new AuthError('Email is required', 400);
          }
      
          // Fetch Firebase and MongoDB user in parallel
          const [firebaseUser, mongoUser] = await Promise.all([
            auth.getUserByEmail(email),
            UserAuth.findOne({ email })
          ]);
      
          if (!mongoUser) {
            throw new AuthError('User not found', 404);
          }
      
          // Check and update verification status if different
          if (firebaseUser.emailVerified !== mongoUser.isEmailVerified) {
            const updatedUser = await UserAuth.findByIdAndUpdate(
              mongoUser._id, 
              {
                isEmailVerified: firebaseUser.emailVerified,
                verifiedAt: firebaseUser.emailVerified ? new Date() : null,
                lastUpdateTimestamp: new Date()
              },
              { new: true }
            );
      
            return res.status(200).json({
              status: 'success',
              data: {
                email,
                isVerified: firebaseUser.emailVerified,
                updated: true
              }
            });
          }
      
          return res.status(200).json({
            status: 'success',
            data: {
              email,
              isVerified: mongoUser.isEmailVerified,
              updated: false
            }
          });
      
        } catch (error) {
          console.error('Verification status sync error:', error);
          throw new AuthError(error.message, error.statusCode || 500);
        }
      },
  // OAuth and Token Management
  googleSignIn: async (req, res) => {
    try {
      const { googleUser } = req;
      let { user: userAuth } = req;

      if (!userAuth?.provider.includes('google')) {
        throw new AuthError('Google authentication required', 401);
      }

      if (!userAuth.firebaseUid) {
        const firebaseUser = await auth.createUser({
          email: userAuth.email,
          emailVerified: googleUser.email_verified,
          displayName: googleUser.name,
          photoURL: googleUser.picture
        });

        userAuth = await UserAuth.findByIdAndUpdate(
          userAuth._id,
          { firebaseUid: firebaseUser.uid },
          { new: true }
        );
      }

      const accessToken = generateToken(userAuth);
      const refreshToken = generateRefreshToken(userAuth);
      setTokenCookie(res, accessToken, refreshToken);

      await logEmailActivity(userAuth._id, userAuth.email, 'google_signin');

      return res.status(200).json({
        status: 'success',
        data: {
          user: {
            email: userAuth.email,
            isVerified: userAuth.isEmailVerified || googleUser.email_verified,
            provider: userAuth.provider
          },
          accessToken
        }
      });
    } catch (error) {
      throw new AuthError(error.message, error.statusCode || 500);
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) throw new AuthError('No refresh token provided', 401);

      const user = await UserAuth.findById(refreshToken.id).select('+tokenVersion');
      if (!user) throw new AuthError('User not found', 404);

      if (user.tokenVersion !== refreshToken.version) {
        throw new AuthError('Session has been invalidated', 401);
      }

      const accessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);
      setTokenCookie(res, accessToken, newRefreshToken);

      return res.status(200).json({
        status: 'success',
        data: { accessToken }
      });
    } catch (error) {
      clearAuthCookies(res);
      throw new AuthError('Invalid refresh token', 401);
    }
  },

  // Password and Session Management
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await UserAuth.findById(req.user._id).select('+password');

      if (!user.provider.includes('local')) {
        throw new AuthError('Password change not available for this account type', 400);
      }

      if (!(await user.comparePassword(currentPassword))) {
        throw new AuthError('Current password is incorrect', 401);
      }

      user.password = newPassword;
      if (user.firebaseUid) {
        await auth.updateUser(user.firebaseUid, { password: newPassword });
      }

      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      await logEmailActivity(user._id, user.email, 'password_changed');
      clearAuthCookies(res);

      return res.status(200).json({
        status: 'success',
        message: 'Password changed successfully. Please login again.'
      });
    } catch (error) {
      throw new AuthError(error.message, error.statusCode || 500);
    }
  },
  

  resendVerificationEmail: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new Error('Email is required');
      }

      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL}/verify-email/complete?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true
      };

      // Resend verification email
      const verificationLink = await auth.generateEmailVerificationLink(
        email, 
        actionCodeSettings
      );

      return res.status(200).json({
        status: 'success',
        message: 'Verification email has been resent'
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to resend verification email'
      });
    }
  },
  
  resetPasswordRequest: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await UserAuth.findOne({ email });

      if (!user) throw new AuthError('User not found', 404);
      if (!user.provider.includes('local')) {
        throw new AuthError('Password reset not available for this account type', 400);
      }

      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true
      };

      const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);
      const { sendPasswordResetEmail } = await import('../utils/email.js');
      await sendPasswordResetEmail(email, resetLink);

      await logEmailActivity(user._id, email, 'password_reset_requested');

      return res.status(200).json({
        status: 'success',
        message: 'Password reset email sent',
        data: {
          email,
          resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
        }
      });
    } catch (error) {
      throw new AuthError(error.message, error.statusCode || 500);
    }
  },

  confirmPasswordReset: async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      await auth.confirmPasswordReset(code, newPassword);
      
      const user = await UserAuth.findOne({ email });
      if (user) {
        user.password = newPassword;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        await logEmailActivity(user._id, email, 'password_reset_completed');
      }

      return res.status(200).json({
        status: 'success',
        message: 'Password reset successful. Please login with your new password.'
      });
    } catch (error) {
      throw new AuthError(error.message, error.statusCode || 500);
    }
  },

  invalidateAllSessions: async (req, res) => {
    try {
      const user = await UserAuth.findById(req.user._id);
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      clearAuthCookies(res);
      await logEmailActivity(user._id, user.email, 'all_sessions_invalidated');

      return res.status(200).json({
        status: 'success',
        message: 'All sessions have been invalidated successfully'
      });
    } catch (error) {
      throw new AuthError(error.message, error.statusCode || 500);
    }
  },

    // Add these new methods INSIDE the authController object
    deleteUser: async (req, res) => {
      try {
        const { password } = req.body;
        const user = await UserAuth.findById(req.user._id).select('+password');

        if (!user) throw new AuthError('User not found', 404);

        if (user.provider.includes('local')) {
          if (!password) throw new AuthError('Password required for deletion', 400);
          if (!(await user.comparePassword(password))) {
            throw new AuthError('Invalid password', 401);
          }
        }

        if (user.firebaseUid) {
          try {
            await auth.deleteUser(user.firebaseUid);
          } catch (error) {
            console.error('Firebase user deletion error:', error);
          }
        }

        await logEmailActivity(user._id, user.email, 'account_deleted');
        await UserAuth.findByIdAndDelete(user._id);
        clearAuthCookies(res);

        return res.status(200).json({
          status: 'success',
          message: 'Account deleted successfully'
        });
      } catch (error) {
        throw new AuthError(error.message, error.statusCode || 500);
      }
    },

  deleteAllUsers: async (req, res) => {
      const session = await UserAuth.startSession();
      session.startTransaction();
    
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
            // 2.1 Delete from Firebase if firebaseUid exists
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
    
            // 2.2 Delete user profile if exists
            if (user.profile) {
              await UserProfile.findByIdAndDelete(user.profile._id, { session });
              console.log(`Profile deleted for user: ${user.email}`);
            }
    
            // 2.3 Delete user auth record
            await UserAuth.findByIdAndDelete(user._id, { session });
    
            // 2.4 Log the deletion
            await logEmailActivity(
              user._id,
              user.email,
              'account_deleted_admin',
              {
                deletedBy: 'admin',
                deletionType: 'bulk_delete',
                timestamp: new Date()
              }
            );
    
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
            // Continue with next user instead of stopping the whole process
          }
        }
    
        // 3. Clean up any orphaned profiles
        const orphanedProfiles = await UserProfile.find({
          user: { $nin: users.map(u => u._id) }
        });
    
        if (orphanedProfiles.length > 0) {
          await UserProfile.deleteMany({
            _id: { $in: orphanedProfiles.map(p => p._id) }
          }, { session });
    
          console.log(`Cleaned up ${orphanedProfiles.length} orphaned profiles`);
        }
    
        // 4. Commit the transaction
        await session.commitTransaction();
    
        // 5. Double-check Firebase users
        try {
          const remainingFirebaseUsers = await auth.listUsers();
          if (remainingFirebaseUsers.users.length > 0) {
            console.log('Cleaning up remaining Firebase users...');
            const deletePromises = remainingFirebaseUsers.users.map(user =>
              auth.deleteUser(user.uid).catch(error => {
                console.error(`Failed to delete Firebase user ${user.email}:`, error);
              })
            );
            await Promise.all(deletePromises);
          }
        } catch (firebaseListError) {
          console.error('Error checking remaining Firebase users:', firebaseListError);
        }
    
        return res.status(200).json({
          status: 'success',
          message: 'Bulk user deletion completed',
          data: {
            ...deletionResults,
            orphanedProfilesDeleted: orphanedProfiles.length
          }
        });
    
      } catch (error) {
        await session.abortTransaction();
        console.error('Bulk deletion error:', error);
    
        throw new AuthError(
          'Failed to complete bulk user deletion: ' + error.message,
          error.statusCode || 500
        );
    
      } finally {
        await session.endSession();
      }
    },

    verifyLogin: async (req, res) => {
      try {
        const user = await UserAuth.findById(req.user._id);
        if (!user) throw new AuthError('User not found', 404);

        return res.status(200).json({
          status: 'success',
          data: {
            user: {
              email: user.email,
              isVerified: user.isEmailVerified,
              provider: user.provider
            }
          }
        });
      } catch (error) {
        throw new AuthError(error.message, error.statusCode || 500);
      }
    }
  };




  export { authController as default, AuthError };