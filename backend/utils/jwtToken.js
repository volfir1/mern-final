// utils/jwtToken.js
import jwt from 'jsonwebtoken';


export const generateToken = (user) => {
  if (!user?._id) {
    throw new Error('User ID is required for token generation');
  }

  const payload = {
    id: user._id,
    role: user.role || 'user', // Default to 'user' role if not set
    email: user.email || '', // Ensure email is a string even if undefined
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(), // Fallback to full name or an empty string
  };

  const jwtOptions = {
    algorithm: 'HS384', // Specify the algorithm explicitly
    expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Set token expiration
    issuer: process.env.JWT_ISSUER || 'http://localhost:3000', // Add issuer
    audience: process.env.JWT_AUDIENCE || 'http://localhost:3000/api', // Add audience
  };

  try {
    return jwt.sign(payload, process.env.JWT_SECRET, jwtOptions);
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Token generation failed');
  }
};


export const verifyToken = (token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
};

export const getTokenFromRequest = (req) => {
  let token = null;

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Check cookies as fallback
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  return token;
};

export const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
};

export const clearAuthCookies = (res) => {
  res.cookie('token', '', { 
    httpOnly: true,
    expires: new Date(0)
  });
};

export default {
  generateToken,
  verifyToken,
  getTokenFromRequest,
  setTokenCookie,
  clearAuthCookies
};

// Add this method to TokenManager
verifyToken: async (token) => {
  try {
    const response = await axios.post('/api/auth/verify-token', 
      { firebaseToken: token },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      console.debug('Token verified successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}