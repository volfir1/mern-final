// middleware/auth.js
import jwt from 'jsonwebtoken';
import UserAuth from '../models/userAuth.js';
import UserProfile from '../models/userProfile.js';
import { 
  generateToken, 
  generateRefreshToken, 
  setTokenCookie, 
  getTokenFromRequest 
} from '../utils/jwtToken.js';

// Base Error Class
class AppError extends Error {
  constructor(message, statusCode, extras = {}) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Object.assign(this, extras);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: this.status,
      message: this.message,
      ...(this.errors && { errors: this.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

// Async Handler
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const protect = asyncHandler(async (req, res, next) => {
  // Check if route is related to email verification
  const isEmailVerificationRoute = req.path.includes('/verify/send') || 
                                 req.path.includes('/verify/resend') ||
                                 req.path.includes('/verify/email');

  // Get token using the utility function
  const token = getTokenFromRequest(req);

  if (!token) {
    throw new AppError('Access token not found', 401);
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const userAuth = await UserAuth.findById(decoded.id)
      .select('+refreshToken email role isActive isEmailVerified')
      .lean();

    if (!userAuth) {
      throw new AppError('User not found', 401);
    }

    // Check if user is active
    if (!userAuth.isActive) {
      throw new AppError('Account is inactive', 403);
    }

    // Only check email verification for non-email-verification routes
    if (!isEmailVerificationRoute && !userAuth.isEmailVerified) {
      throw new AppError('Email not verified', 403);
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ user: userAuth._id })
      .select('firstName lastName displayName phoneNumber profileImage bio')
      .lean();

    // Attach user to request
    req.user = {
      ...userAuth,
      profile: userProfile || null
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401);
    }
    throw error;
  }
});


export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token not found', 401);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const userAuth = await UserAuth.findById(decoded.id)
      .select('+refreshToken email role isActive isEmailVerified tokenVersion provider')
      .lean();

    if (!userAuth || userAuth.tokenVersion !== decoded.version) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new tokens using the utility functions
    const newAccessToken = generateToken(userAuth);
    const newRefreshToken = generateRefreshToken(userAuth);

    // Set the cookies using the utility function
    setTokenCookie(res, newAccessToken, newRefreshToken);

    const userProfile = await UserProfile.findOne({ user: userAuth._id })
      .select('firstName lastName displayName phoneNumber profileImage bio dateOfBirth gender address')
      .lean();

    req.user = {
      ...userAuth,
      profile: userProfile || null
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid refresh token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token has expired', 401);
    }
    throw error;
  }
});

export const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    if (roles.includes('admin')) {
      const user = await UserAuth.findById(req.user._id)
        .select('+passwordChangedAt')
        .lean();
      
      if (user?.passwordChangedAt) {
        const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
        
        if (req.decoded?.iat < changedTimestamp) {
          throw new AppError('Recent password change detected. Please login again.', 401);
        }
      }
    }

    next();
  });
};

// Export error classes and handlers for use in other files if needed
export { AppError, asyncHandler };