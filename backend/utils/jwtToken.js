// utils/jwtToken.js
import jwt from 'jsonwebtoken';

/**
 * Generate JWT Token
 * @param {Object} user - User object containing _id and role
 * @param {String} expiresIn - Token expiration time (optional)
 * @returns {String} JWT Token
 */
// utils/jwtToken.js
export const generateToken = (user, expiresIn = process.env.JWT_EXPIRES_IN || '30d') => {
  try {
      if (!user._id) {
          throw new Error('User ID is required');
      }

      // Ensure role is included
      const payload = {
          id: user._id,
          role: user.role || 'user', // Default to 'user' if role is not set
          email: user.email,
          name: user.name
      };

      console.log('Generating token with payload:', payload);

      return jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn }
      );
  } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify JWT Token
 * @param {String} token - JWT Token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Generate Refresh Token
 * @param {Object} user - User object containing _id
 * @returns {String} Refresh Token
 */
export const generateRefreshToken = (user) => {
  try {
    return jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  } catch (error) {
    console.error('Refresh token generation error:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Get token from request headers or cookie
 * @param {Object} req - Express request object
 * @returns {String|null} Token or null
 */
export const getTokenFromRequest = (req) => {
  // Check header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // Check cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

/**
 * Set token in response cookie
 * @param {Object} res - Express response object
 * @param {String} token - JWT Token
 * @param {String} refreshToken - Refresh Token (optional)
 */
export const setTokenCookie = (res, token, refreshToken = null) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '30') * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('token', token, cookieOptions);

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      expires: new Date(
        Date.now() + parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000
      )
    });
  }
};

/**
 * Clear auth cookies
 * @param {Object} res - Express response object
 */
export const clearAuthCookies = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });
};

export default {
  generateToken,
  verifyToken,
  generateRefreshToken,
  getTokenFromRequest,
  setTokenCookie,
  clearAuthCookies
};