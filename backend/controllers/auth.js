// controllers/auth.js
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import admin, { auth, firebaseOperations, realtimeDb, db} from '../config/firebase-admin.js';
import UserAuth from '../models/userAuth.js';
import UserProfile from '../models/userProfile.js';
import { uploadImage, deleteImage, CLOUDINARY_FOLDERS, DEFAULT_IMAGES } from '../utils/cloudinary.js';
import { verifyToken } from '../utils/jwtToken.js';
import { sendVerificationEmail } from '../utils/emailVerification.js';
import jwtToken from '../utils/jwtToken.js';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import firebaseAdmin from '../config/firebase-admin.js';
import { generateTokens } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const { 
  generateToken,
  generateRefreshToken, 
  setTokenCookie, 
  clearAuthCookies 
} = jwtToken;
import jsonwebtoken from 'jsonwebtoken';
import argon2 from 'argon2';



// Helper Functions
const verifyRoleSync = async (userId, expectedRole) => {
  try {
    const [firebaseUser, mongoUser] = await Promise.all([
      auth.getUser(userId),
      UserAuth.findOne({ firebaseUid: userId })
    ]);

    const firebaseRole = (firebaseUser.customClaims || {}).role;
    
    if (firebaseRole !== expectedRole || mongoUser.role !== expectedRole) {
      console.log(`Role mismatch detected for user ${userId}. Syncing...`);
      await firebaseOperations.syncUserRole(userId, expectedRole);
      console.log('Role sync completed');
    }
    
    return true;
  } catch (error) {
    console.error('Role sync verification failed:', error);
    return false;
  }
};

const handleError = (res, error, message, statusCode = 500) => {
  console.error(`${message}:`, error);
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

const getUserData = async (userAuth) => {
  const userProfile = await UserProfile.findOne({ userId: userAuth._id });
  if (!userProfile) {
    throw new Error('User profile not found');
  }
  
  return {
    _id: userAuth._id,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    fullName: userProfile.fullName,
    email: userAuth.email,
    role: userAuth.role,
    isEmailVerified: userAuth.isEmailVerified,
    image: userProfile.image,
    provider: userAuth.provider
  };
};




export const verifyEmailWithCode = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      console.log('No token provided');
      return res.redirect('/email-verified?success=false&error=missing_token');
    }

    try {
      // Decode and verify the token
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.uid) {
        console.log('Invalid token structure:', decoded);
        return res.redirect('/email-verified?success=false&error=invalid_token');
      }

      const email = decoded.uid;
      console.log('Attempting to verify email:', email);

      // Get user from Firebase
      const firebaseUser = await auth.getUserByEmail(email)
        .catch(error => {
          console.error('Firebase getUserByEmail error:', error);
          throw new Error('user_not_found');
        });

      if (!firebaseUser) {
        return res.redirect('/email-verified?success=false&error=user_not_found');
      }

      // Check if already verified
      if (firebaseUser.emailVerified) {
        console.log('Email already verified for:', email);
        return res.redirect('/email-verified?success=true&message=already_verified');
      }

      // Update all three databases (Firebase Auth, MongoDB, and Firebase Realtime DB)
      await Promise.all([
        // 1. Update Firebase Authentication
        auth.updateUser(firebaseUser.uid, {
          emailVerified: true
        })
        .catch(error => {
          console.error('Firebase Auth update error:', error);
          throw new Error('firebase_auth_update_failed');
        }),

        // 2. Update MongoDB user
        UserAuth.findOneAndUpdate(
          { email: email.toLowerCase() },
          {
            isEmailVerified: true,
            emailVerifiedAt: new Date()
          },
          { new: true }
        )
        .catch(error => {
          console.error('MongoDB update error:', error);
          throw new Error('database_update_failed');
        }),

        // 3. Update Firebase Realtime Database
        realtimeDb.ref(`users/${firebaseUser.uid}`).update({
          isEmailVerified: true,
          emailVerifiedAt: new Date().toISOString()
        })
        .catch(error => {
          console.error('Realtime Database update error:', error);
          throw new Error('realtime_db_update_failed');
        }),

        // 4. Update Firestore
        db.collection('users').doc(firebaseUser.uid).update({
          isEmailVerified: true,
          emailVerifiedAt: new Date().toISOString()
        })
        .catch(error => {
          console.error('Firestore update error:', error);
          throw new Error('firestore_update_failed');
        })
      ]);

      // Log successful verification
      console.log('Email verification successful for:', email);
      
      // Update user session if exists
      try {
        const sessionRef = realtimeDb.ref(`sessions/${firebaseUser.uid}`);
        const sessionSnapshot = await sessionRef.once('value');
        if (sessionSnapshot.exists()) {
          await sessionRef.update({
            isEmailVerified: true,
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (sessionError) {
        console.error('Session update error:', sessionError);
        // Don't throw here as this is not critical
      }

      return res.redirect('/email-verified?success=true');

    } catch (error) {
      console.error('Verification process error:', error);
      const errorMessage = error.message || 'verification_failed';
      return res.redirect(`/email-verified?success=false&error=${errorMessage}`);
    }

  } catch (error) {
    console.error('Token processing error:', error);
    return res.redirect(`/email-verified?success=false&error=token_processing_failed`);
  }
};


export const handleAuthActionCode = async (req, res) => {
  try {
    const { mode, oobCode } = req.query;
    console.log('Action handler received:', { mode, oobCode });

    if (!oobCode) {
      console.error('Missing oobCode in request');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`);
    }

    if (mode === 'verifyEmail') {
      try {
        const actionCodeInfo = await auth.checkActionCode(oobCode);
        const email = actionCodeInfo?.data?.email;
        const uid = actionCodeInfo?.data?.uid;

        if (!email) {
          console.error('Email not found in actionCodeInfo');
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=email_not_found`);
        }

        await auth.applyActionCode(oobCode);

        await Promise.all([
          auth.updateUser(uid, { emailVerified: true }),
          UserAuth.findOneAndUpdate(
            { email: email.toLowerCase() },
            { 
              isEmailVerified: true,
              updatedAt: new Date()
            },
            { new: true }
          )
        ]);

        console.log('Verification completed for:', email);
        return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
      } catch (verificationError) {
        console.error('Verification error:', verificationError);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=verification_failed`);
      }
    }

    if (mode === 'resetPassword') {
      return res.redirect(`${process.env.FRONTEND_URL}/reset-password?oobCode=${oobCode}`);
    }

    res.redirect(`${process.env.FRONTEND_URL}/login`);
  } catch (error) {
    console.error('Action handler error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=action_failed`);
  }
};

// Main Authentication Functions
export const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  let userRecord = null;
  let committed = false;

  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;

    if (!firstName || !lastName || !email || !password) {
      throw new Error('All fields (firstName, lastName, email, and password) are required');
    }

    console.log(`Starting registration for email: ${email}`);

    // Step 1: Create Firebase user
    userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });

    // Sync role immediately after creating Firebase user
    await firebaseOperations.syncUserRole(userRecord.uid, role);

    console.log(`Successfully synced role '${role}' for user ${userRecord.uid}`);

    // Step 2: Save to MongoDB - UserAuth and UserProfile
    const [userAuth] = await UserAuth.create(
      [
        {
          email: email.toLowerCase(),
          password,
          firebaseUid: userRecord.uid,
          provider: 'local',
          role,
          isEmailVerified: false,
        },
      ],
      { session }
    );

    const [userProfile] = await UserProfile.create(
      [
        {
          userId: userAuth._id,
          firstName,
          lastName,
          image: {
            public_id: 'default',
            url: 'https://default.image.url',
          },
        },
      ],
      { session }
    );

    console.log(`MongoDB UserAuth and UserProfile created for user: ${userAuth.email}`);

    // Step 3: Sync with Firestore including role
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: `${firstName} ${lastName}`,
      role,
      createdAt: new Date().toISOString(),
      isEmailVerified: false,
    });

    console.log(`User metadata synced with Firestore for UID: ${userRecord.uid}`);

    // Step 4: Update Realtime Database including role
    await realtimeDb.ref(`users/${userRecord.uid}`).set({
      email,
      displayName: `${firstName} ${lastName}`,
      role,
      createdAt: new Date().toISOString(),
      isEmailVerified: false,
    });

    console.log(`User session initialized in Realtime Database for UID: ${userRecord.uid}`);

    // Step 5: Send verification email
    const verificationLink = await auth.generateEmailVerificationLink(email, {
      url: `${process.env.FRONTEND_URL}/verify-email`,
      handleCodeInApp: true
    });

    await sendVerificationEmail(email, {
      name: firstName,
      verificationLink,
    });

    console.log(`Verification email sent to: ${email}`);

    // Generate initial token
    const token = generateTokens(userAuth, userProfile);

    // Commit MongoDB transaction
    await session.commitTransaction();
    committed = true;

    // Set cookie and send response
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        _id: userAuth._id,
        email: userAuth.email,
        role: userAuth.role,
        displayName: `${firstName} ${lastName}`,
        profile: {
          _id: userProfile._id,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`.trim(),
          image: userProfile.image,
        },
      },
    });

  } catch (error) {
    console.error('Registration error:', error.message);

    // Only abort if we haven't committed
    if (!committed) {
      await session.abortTransaction().catch(console.error);
    }

    // Clean up Firebase user if it was created
    if (userRecord && userRecord.uid) {
      await auth.deleteUser(userRecord.uid).catch((err) => {
        console.error('Error deleting Firebase user:', err.message);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, password: '***' }); // Debug log

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user in MongoDB first (for better performance)
    const user = await UserAuth.findOne({ email })
      .select('+password')
      .populate('profile');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify with Firebase
    try {
      const firebaseUser = await auth.getUserByEmail(email);
      if (!firebaseUser.emailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in',
        });
      }
      
      // Sync role with Firebase
      await firebaseOperations.syncUserRole(firebaseUser.uid, user.role);
    } catch (firebaseError) {
      console.error('Firebase verification error:', firebaseError);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
      });
    }

    // Get or ensure user profile exists
    let userProfile = await UserProfile.findOne({ userId: user._id });
    if (!userProfile) {
      userProfile = await UserProfile.create({
        userId: user._id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }

    // Generate token
    const token = generateTokens(user, userProfile);

    // Set cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send response
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        displayName: userProfile.fullName,
        profile: {
          _id: userProfile._id,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          fullName: userProfile.fullName,
          image: userProfile.image,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

  


export const googleLoginHandler = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    try {
      const decodedToken = await auth.verifyIdToken(credential);
      const { email, name, picture } = decodedToken;

      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
      } catch (error) {
        userRecord = await auth.createUser({
          email,
          displayName: name,
          photoURL: picture,
          emailVerified: true
        });
      }

      let mongoUser = await UserAuth.findOne({ email: email.toLowerCase() });
      
      if (!mongoUser) {
        mongoUser = await UserAuth.create({
          email: email.toLowerCase(),
          firebaseUid: decodedToken.uid,
          provider: 'google',
          role: 'user',
          isEmailVerified: email_verified,
          firstName,
          lastName,
          displayName: name, // Optional for Firebase compatibility
          photoURL: picture,
        });
      }

      const accessToken = jwt.sign(
        {
          uid: userRecord.uid,
          email: userRecord.email,
          role: mongoUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { uid: userRecord.uid },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await UserAuth.findByIdAndUpdate(mongoUser._id, {
        refreshToken,
        lastLogin: new Date()
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Google login successful',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: name,
          role: mongoUser.role,
          isEmailVerified: true,
          photoURL: picture
        }
      });

    } catch (error) {
      console.error('Google login error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credentials'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Password Management Functions
export const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/reset-password`,
      handleCodeInApp: true
    };

    const resetLink = await auth.generatePasswordResetLink(
      email.toLowerCase(),
      actionCodeSettings
    );

    await sendVerificationEmail(email.toLowerCase(), {
      template: 'reset-password',
      verificationLink: resetLink
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    return handleError(res, error, 'Error sending reset email', 400);
  }
};

export const handlePasswordReset = async (req, res) => {
  try {
    const { token, password } = req.body;

    // First verify the token and get the email
    const email = await auth.verifyPasswordResetCode(token);
    
    // Update Firebase password
    await auth.confirmPasswordReset(token, password);

    // Update MongoDB password with Argon2 hash
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      hashLength: 32
    });

    await UserAuth.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: hashedPassword }
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    return handleError(res, error, 'Error resetting password', 400);
  }
};

export const handleChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { uid } = req.firebaseUser;

    // Get user from MongoDB to verify current password
    const user = await UserAuth.findOne({ firebaseUid: uid }).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password with Argon2
    const isValidPassword = await argon2.verify(user.password, currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Update password in Firebase
    await auth.updateUser(uid, {
      password: newPassword
    });

    // Update password in MongoDB with Argon2
    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      hashLength: 32
    });

    await UserAuth.findByIdAndUpdate(user._id, {
      password: hashedPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    return handleError(res, error, 'Error changing password', 400);
  }
};

// Email Verification Functions
export const sendVerificationEmailHandler = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Get Firebase user
    const firebaseUser = await auth.getUserByEmail(email);
    
    if (!firebaseUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (firebaseUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate Firebase verification link
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email`,
      handleCodeInApp: true
    };

    const verificationLink = await auth.generateEmailVerificationLink(
      email,
      actionCodeSettings
    );

    // Send verification email using Firebase's default template
    // The email will be automatically sent by Firebase
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { uid } = req.firebaseUser;
    const userAuth = await UserAuth.findOne({ firebaseUid: uid });

    if (!userAuth) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userAuth.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email`,
      handleCodeInApp: true
    };

    const verificationLink = await auth.generateEmailVerificationLink(
      userAuth.email,
      actionCodeSettings
    );

    await sendVerificationEmail(userAuth.email, {
      verificationLink,
      template: 'verify-email'
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    return handleError(res, error, 'Error sending verification email', 400);
  }
};

// Session Management Functions
// controllers/auth.js
export const logout = (req, res) => {
  try {
    // Clear auth cookies
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.cookies;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    const decoded = verifyToken(token);
    const userAuth = await UserAuth.findById(decoded.id);
    
    if (!userAuth) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const tokens = generateToken(userAuth);
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    return handleError(res, error, 'Error refreshing token', 401);
  }
};

export const checkAuth = async (req, res) => {
  try {
    const { uid } = req.firebaseUser;
    const userAuth = await UserAuth.findOne({ firebaseUid: uid });
    
    if (!userAuth) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = await getUserData(userAuth);
    res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: userData
    });
  } catch (error) {
    return handleError(res, error, 'Error checking auth status', 401);
  }
};

// Development/Admin Functions

export const deleteAllUsers = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'This operation is not allowed in production',
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Delete all users in MongoDB
    const [deletedUserAuths, deletedUserProfiles] = await Promise.all([
      UserAuth.deleteMany({}, { session }),
      UserProfile.deleteMany({}, { session }),
    ]);

    // Step 2: Delete all users from Firebase Authentication
    const firebaseUsers = await auth.listUsers(); // List all Firebase users
    await Promise.all(firebaseUsers.users.map((user) => auth.deleteUser(user.uid)));

    // Step 3: Delete all records in Firestore
    const firestoreUsers = await db.collection('users').get(); // Fetch all Firestore documents in "users" collection
    await Promise.all(
      firestoreUsers.docs.map((doc) => db.collection('users').doc(doc.id).delete())
    );

    // Step 4: Delete all records in Realtime Database
    const realtimeDbRef = realtimeDb.ref('users'); // Get reference to the "users" node in Realtime Database
    await realtimeDbRef.remove(); // Delete the entire "users" node

    // Step 5: Delete profile images from Cloudinary
    const userProfiles = await UserProfile.find({});
    await Promise.all(
      userProfiles
        .filter((profile) => profile.image?.public_id && profile.image.public_id !== 'default')
        .map((profile) =>
          deleteImage(profile.image.public_id, CLOUDINARY_FOLDERS.USERS)
        )
    );

    // Commit MongoDB transaction
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Deleted ${deletedUserAuths.deletedCount} user accounts, ${deletedUserProfiles.deletedCount} user profiles, and all associated Firebase, Firestore, and Realtime Database records`,
    });
  } catch (error) {
    await session.abortTransaction();
    return handleError(res, error, 'Error deleting all users', 500);
  } finally {
    session.endSession();
  }
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const googleSignIn = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Firebase token required' });
    }

    const decodedToken = await auth.verifyIdToken(credential);
    const { email, name, picture, email_verified } = decodedToken;

    // Sync with MongoDB
    let mongoUser = await UserAuth.findOne({ email: email.toLowerCase() });
    if (!mongoUser) {
      mongoUser = await UserAuth.create({
        email: email.toLowerCase(),
        firebaseUid: decodedToken.uid,
        provider: 'google',
        role: 'user',
        isEmailVerified: email_verified,
        displayName: name,
        photoURL: picture
      });
    }

    // Generate and set tokens
    const accessToken = generateToken(mongoUser);
    const refreshToken = generateRefreshToken(mongoUser);
    setTokenCookie(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email,
        displayName: name,
        role: mongoUser.role,
        isEmailVerified: email_verified,
        photoURL: picture
      }
    });
  } catch (error) {
    return handleError(res, error, 'Google sign-in failed');
  }
};

export const handleEmailVerification = async (req, res) => {
  try {
    const { oobCode } = req.query; // Firebase sends oobCode instead of token
    
    if (!oobCode) {
      return res.redirect(`${process.env.FRONTEND_URL}/email-verified?success=false&error=missing_code`);
    }

    try {
      // Verify the action code first
      const info = await auth.checkActionCode(oobCode);
      
      // Apply the verification code
      await auth.applyActionCode(oobCode);

      // Get user email from the verification info
      const email = info.data.email;
      const firebaseUser = await auth.getUserByEmail(email);

      // Update both Firebase and MongoDB
      await Promise.all([
        // Update Firebase user
        auth.updateUser(firebaseUser.uid, {
          emailVerified: true
        }),

        // Update MongoDB user
        UserAuth.findOneAndUpdate(
          { email: email.toLowerCase() },
          {
            isEmailVerified: true,
            emailVerifiedAt: new Date()
          },
          { new: true }
        )
      ]);

      return res.redirect(`${process.env.FRONTEND_URL}/email-verified?success=true`);
    } catch (error) {
      console.error('Verification error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/email-verified?success=false&error=${encodeURIComponent(error.message)}`);
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/email-verified?success=false&error=verification_failed`);
  }
};



export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('Getting profile for userId:', userId);

    // Get user data from all sources
    const [firebaseUser, mongoUser, userMetadata] = await Promise.all([
      auth.getUser(userId),
      UserAuth.findOne({ firebaseUid: userId }),
      firebaseOperations.getUserMetadata(userId)
    ]);

    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    // Verify role synchronization
    const firebaseClaims = firebaseUser.customClaims || {};
    if (mongoUser.role !== firebaseClaims.role) {
      await firebaseOperations.syncUserRole(userId, mongoUser.role);
    }

    res.json({
      success: true,
      profile: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        phoneNumber: firebaseUser.phoneNumber,
        role: mongoUser.role,
        disabled: firebaseUser.disabled,
        createdAt: firebaseUser.metadata.creationTime,
        lastSignInTime: firebaseUser.metadata.lastSignInTime,
        ...userMetadata
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
