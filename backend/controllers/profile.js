// controllers/profile.js
import { auth } from '../config/firebase-admin.js';
import UserAuth from '../models/userAuth.js';
import UserProfile from '../models/userProfile.js';

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Utility function for processing profile images
const processProfileImage = (file) => {
  if (!file) return null;
  
  return {
    url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    path: file.originalname,
    publicId: `temp_${Date.now()}`
  };
};

// Parse multipart/form-data or JSON request
const parseRequestData = (req) => {
  if (req.is('multipart/form-data')) {
    const data = { ...req.body };
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        data[key] = data[key][0];
      }
    });
    return {
      ...data,
      file: req.files?.profileImage?.[0]
    };
  }
  return req.body;
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const user = await UserAuth.findById(req.user.id)
      .populate('profile')
      .select('-password -refreshToken');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const user = await UserAuth.findById(req.user.id).populate('profile');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updates = parseRequestData(req);
    const { firstName, lastName, phoneNumber } = updates;

    let updatedProfile;

    if (user.profile) {
      // Update existing profile
      updatedProfile = await UserProfile.findByIdAndUpdate(
        user.profile._id,
        {
          firstName: firstName || user.profile.firstName,
          lastName: lastName || user.profile.lastName,
          displayName: firstName && lastName 
            ? `${firstName} ${lastName}`
            : user.profile.displayName,
          phoneNumber: phoneNumber || user.profile.phoneNumber
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      updatedProfile = await UserProfile.create({
        user: user._id,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        phoneNumber
      });

      user.profile = updatedProfile._id;
      await user.save();
    }

    // Update Firebase display name if changed
    if (firstName || lastName) {
      await auth.updateUser(user.firebaseUid, {
        displayName: updatedProfile.displayName
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: updatedProfile
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = parseRequestData(req);

    const user = await UserAuth.findById(req.user.id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password in Firebase
    await auth.updateUser(user.firebaseUid, { 
      password: newPassword 
    });

    // Update password in MongoDB
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

// Upload Profile Image
export const uploadProfileImage = async (req, res) => {
  try {
    const user = await UserAuth.findById(req.user.id).populate('profile');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const profileImage = req.files?.profileImage?.[0];
    if (!profileImage) {
      throw new AppError('No image file uploaded', 400);
    }

    const processedImage = processProfileImage(profileImage);

    let updatedProfile;

    if (user.profile) {
      // Update existing profile
      updatedProfile = await UserProfile.findByIdAndUpdate(
        user.profile._id,
        { profileImage: processedImage },
        { new: true }
      );
    } else {
      // Create new profile
      updatedProfile = await UserProfile.create({
        user: user._id,
        profileImage: processedImage
      });

      user.profile = updatedProfile._id;
      await user.save();
    }

    return res.status(200).json({
      status: 'success',
      data: {
        profileImage: updatedProfile.profileImage
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

// Delete Profile Image
export const deleteProfileImage = async (req, res) => {
  try {
    const user = await UserAuth.findById(req.user.id).populate('profile');
    if (!user || !user.profile) {
      throw new AppError('User profile not found', 404);
    }

    // Remove profile image
    if (user.profile.profileImage) {
      user.profile.profileImage = undefined;
      await user.profile.save();
    }

    return res.status(200).json({
      status: 'success',
      message: 'Profile image deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile image error:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

// Update FCM Token
export const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      throw new AppError('FCM token is required', 400);
    }

    await UserAuth.findByIdAndUpdate(req.user.id, { fcmToken });

    return res.status(200).json({
      status: 'success',
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    console.error('Update FCM token error:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

// Get Profile Settings
export const getProfileSettings = async (req, res) => {
  try {
    const user = await UserAuth.findById(req.user.id)
      .select('email isEmailVerified role fcmToken')
      .populate('profile');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.status(200).json({
      status: 'success',
      data: {
        settings: {
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
          hasFCMToken: !!user.fcmToken,
          hasProfileImage: !!(user.profile?.profileImage),
          notifications: {
            email: true, // You can add user preferences here
            push: !!user.fcmToken
          }
        }
      }
    });
  } catch (error) {
    console.error('Get profile settings error:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

export default {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deleteProfileImage,
  updateFCMToken,
  getProfileSettings
};