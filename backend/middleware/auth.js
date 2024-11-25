// middleware/auth.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, param, validationResult } from 'express-validator';
import UserAuth from '../models/userAuth.js';
import { auth, firebaseOperations } from '../config/firebase-admin.js';


// ===== TOKEN GENERATION =====
/**
 * Generate access and refresh tokens.
 * @param {Object} user - The user object from MongoDB or Firebase.
 * @returns {Object} - Contains accessToken and refreshToken.
 */
export const generateTokens = (user, profile) => {
  if (!user?._id) {
    throw new Error('User ID is required for token generation');
  }

  // Construct name from profile if available, fallback to displayName
  let name = '';
  if (profile?.firstName || profile?.lastName) {
    name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  } else if (user.displayName) {
    name = user.displayName;
  }

  const payload = {
    id: user._id,
    uid: UserAuth.firebaseUid,
    role: user.role || 'user',
    email: user.email,
    name,
    displayName: user.displayName || name, // Include displayName in token
  };

  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Token generation failed');
  }
};





// ===== SECURITY HEADERS =====
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
  next();
};

// ===== AUTHENTICATION MIDDLEWARE =====
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if auth header exists and has correct format
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    try {
      // First try JWT verification
      console.log('Attempting JWT verification...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT Decoded:', decoded);

      // Find user in database
      const user = await UserAuth.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Add user to request object
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (jwtError) {
      console.log('JWT verification failed, trying Firebase...');
      
      try {
        // Try Firebase verification as fallback
        const decodedFirebase = await auth.verifyIdToken(token);
        
        // Find or create user
        let user = await UserAuth.findOne({ firebaseUid: decodedFirebase.uid });
        
        if (!user) {
          user = await UserAuth.create({
            firebaseUid: decodedFirebase.uid,
            email: decodedFirebase.email,
            role: 'user'
          });
        }

        req.user = {
          id: user._id,
          email: user.email,
          role: user.role
        };

        next();
      } catch (firebaseError) {
        console.error('Token verification failed:', {
          jwtError: jwtError.message,
          firebaseError: firebaseError.message
        });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only'
    });
  }
  next();
};
export const requireEmailVerification = async (req, res, next) => {
  try {
    const user = await UserAuth.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified'
      });
    }

    next();
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// ===== REFRESH TOKEN MIDDLEWARE =====
export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token not found' 
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
        audience: process.env.JWT_AUDIENCE,
        issuer: process.env.JWT_ISSUER
      });

      const user = await UserAuth.findById(decoded.id);

      if (!user || user.tokenVersion !== decoded.version) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid refresh token' 
        });
      }

      // Generate new token pair
      const tokens = generateTokens(user._id, user.role);

      // Set secure cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
      });

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid refresh token'
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ===== ROLE-BASED AUTHORIZATION =====
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }

    next();
  };
};



// ===== VALIDATION MIDDLEWARE =====
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  };
};

// ===== UTILITY FUNCTIONS =====
export const verifyJwtToken = async (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

// ===== VALIDATION SCHEMAS =====
export const authValidation = {
  register: [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Invalid role specified')
  ],
  
  login: [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('currentPassword')
      .optional()
      .notEmpty()
      .withMessage('Current password is required to update sensitive information'),
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
      .withMessage('New password must contain uppercase, lowercase, number and special character')
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
      .withMessage('Password must contain uppercase, lowercase, number and special character')
  ],

  forgotPassword: [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail()
  ]
};

export const verifyFirebaseSync = async (req, res, next) => {
  try {
    const { id, email } = req.user;
    if (!id) return next();

    // Find user in MongoDB
    const mongoUser = await UserAuth.findById(id);
    if (!mongoUser) {
      console.error('Firebase sync: MongoDB user not found');
      return next();
    }

    // Check Firebase user
    try {
      const firebaseUser = await auth.getUserByEmail(email);
      console.log('Firebase sync check:', {
        mongoId: id,
        firebaseUid: firebaseUser.uid,
        emailVerified: firebaseUser.emailVerified,
        email: firebaseUser.email
      });

      // Update MongoDB if needed
      if (firebaseUser.emailVerified !== mongoUser.isEmailVerified) {
        await UserAuth.findByIdAndUpdate(id, {
          isEmailVerified: firebaseUser.emailVerified,
          emailVerifiedAt: firebaseUser.emailVerified ? new Date() : null
        });
      }
    } catch (firebaseError) {
      console.error('Firebase user lookup failed:', firebaseError);
    }

    next();
  } catch (error) {
    console.error('Firebase sync error:', error);
    next();
  }
};
export default {
  protect,
  authorize,
  validate,
  securityHeaders,
  refreshAccessToken,
  authValidation,
  generateTokens,
  verifyFirebaseSync,
  getTokenFromRequest
};