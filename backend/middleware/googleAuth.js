
// middleware/googleAuth.js
import { OAuth2Client } from 'google-auth-library';
import { UserAuth, UserProfile } from '../models/index.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Google token not found'
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    
    let userAuth = await UserAuth.findOne({ email: payload.email })
      .select('+refreshToken email role isActive isEmailVerfied tokenversion provider googleId')
      .lean();

    if (!userAuth) {
      // Handle new Google user
      userAuth = await UserAuth.create({
        email: payload.email,
        googleId: true,
        provider: 'google',
        isEmailVerfied: payload.email_verified,
        role: 'user'
      });

      // Create default profile
      await UserProfile.create({
        user: userAuth._id,
        firstName: payload.given_name || 'User',
        lastName: payload.family_name || '',
        displayName: payload.name,
        profileImage: {
          url: payload.picture || null
        }
      });
    }

    req.googleUser = payload;
    req.user = userAuth;
    next();
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid Google token'
    });
  }
};

// utils/authUtils.js
export const requireProvider = (provider) => {
  return (req, res, next) => {
    if (req.user.provider !== provider && req.user.provider !== 'both') {
      return res.status(403).json({
        success: false,
        message: `This action requires ${provider} authentication`
      });
    }
    next();
  };
};

export const requireLocalAuth = (req, res, next) => {
  return requireProvider('local')(req, res, next);
};

export const requireFirebaseAuth = (req, res, next) => {
  return requireProvider('firebase')(req, res, next);
};

export const requireGoogleAuth = (req, res, next) => {
  return requireProvider('google')(req, res, next);
};