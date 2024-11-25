// controllers/profileController.js
import UserProfile from '../models/userProfile.js';
import UserAuth from '../models/userAuth.js';
import { auth } from '../config/firebase-admin.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import { firebaseOperations } from '../config/firebase-admin.js';   
import { CLOUDINARY_FOLDERS } from '../utils/cloudinary.js';

export const profileValidation = [
  body('displayName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
  body('phoneNumber')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
  body('photoURL')
      .optional()
      .isURL()
      .withMessage('Invalid photo URL'),
  body('address')
      .optional()
      .isObject()
      .withMessage('Address must be an object'),
  body('address.street')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Street address is required if address is provided'),
  body('address.city')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('City is required if address is provided'),
  body('address.state')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('State is required if address is provided'),
  body('address.postalCode')
      .optional()
      .trim()
      .matches(/^[0-9]{5}(-[0-9]{4})?$/)
      .withMessage('Invalid postal code format'),
];
// Helper function to format profile response
const formatProfileResponse = (profile, userAuth) => ({
  _id: profile._id,
  userId: profile.userId,
  firstName: profile.firstName,
  lastName: profile.lastName,
  fullName: `${profile.firstName} ${profile.lastName}`,
  email: userAuth?.email,
  phone: profile.phone,
  image: {
    url: profile.image?.url || 'default-profile-url',
    publicId: profile.image?.public_id
  },
  role: userAuth?.role || 'user',
  primaryAddress: profile.primaryAddress,
  additionalAddresses: profile.additionalAddresses,
  isVerified: userAuth?.emailVerified || false,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt
});

  
const validateUserAccess = async (userId, firebaseUid = null) => {
  const query = firebaseUid 
    ? { $or: [{ _id: userId }, { firebaseUid }] }
    : { _id: userId };

  const userAuth = await UserAuth.findOne(query).lean();
  if (!userAuth) {
    throw new Error('User access validation failed');
  }
  return userAuth;
};
// Get user profile
// Get user profile
export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.user;  // Using MongoDB ID from token

        // Get user profile
        const userProfile = await UserProfile.findOne({ userId: id });
        
        if (!userProfile) {
            // If no profile exists, create a default one
            const userAuth = await UserAuth.findById(id);
            if (!userAuth) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Create default profile
            const newProfile = await UserProfile.create({
                userId: id,
                firstName: userAuth.displayName?.split(' ')[0] || '',
                lastName: userAuth.displayName?.split(' ')[1] || '',
                image: {
                    public_id: 'default',
                    url: 'https://res.cloudinary.com/dah5hrzpp/image/upload/v1/ecommerce/defaults/user-default.png'
                }
            });

            return res.json({
                success: true,
                profile: {
                    ...newProfile.toObject(),
                    email: userAuth.email,
                    emailVerified: userAuth.isEmailVerified,
                    addresses: [] // Empty addresses for new profile
                }
            });
        }

        // For existing profiles
        const userAuth = await UserAuth.findById(id);
        
        // Combine profile data
        const profileData = {
            ...userProfile.toObject(),
            email: userAuth.email,
            emailVerified: userAuth.isEmailVerified,
            // Include addresses if they exist
            addresses: userProfile.additionalAddresses || [],
            primaryAddress: userProfile.primaryAddress || null
        };

        res.json({
            success: true,
            profile: profileData
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


  
// Update profile
export const updateProfile = async (req, res) => {
  try {
      const { id: userId } = req.user;
      const updateData = { ...req.body };
      let imageUrl = null;

      // Handle image upload if present
      if (req.file) {
          const uploadResult = await uploadImage(
              req.file.path,
              `profiles/${userId}`
          );
          imageUrl = uploadResult.secure_url;
          
          // Delete old image if exists
          const currentProfile = await UserProfile.findOne({ userId });
          if (currentProfile?.image?.public_id) {
              await deleteImage(currentProfile.image.public_id);
          }
      }

      // Update profile
      const updatedProfile = await UserProfile.findOneAndUpdate(
          { userId },
          {
              ...updateData,
              ...(imageUrl && { image: { url: imageUrl } }),
              updatedAt: new Date()
          },
          { new: true }
      );

      if (!updatedProfile) {
          return res.status(404).json({
              success: false,
              message: 'Profile not found'
          });
      }

      res.json({
          success: true,
          profile: updatedProfile
      });
  } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
          success: false,
          message: 'Error updating profile',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};


// Add additional address
// controllers/profile.js
export const addAddress = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const addressData = req.body;

        console.log('Adding address:', { userId, addressData }); // Debug log

        // Find or create profile
        let profile = await UserProfile.findOne({ userId });
        
        if (!profile) {
            // Create new profile if it doesn't exist
            const userAuth = await UserAuth.findById(userId);
            profile = await UserProfile.create({
                userId,
                firstName: userAuth.displayName?.split(' ')[0] || '',
                lastName: userAuth.displayName?.split(' ')[1] || '',
                additionalAddresses: [], // Initialize empty array
                image: {
                    public_id: 'default',
                    url: 'https://res.cloudinary.com/dah5hrzpp/image/upload/v1/ecommerce/defaults/user-default.png'
                }
            });
        }

        // Validate address data
        if (!addressData.street || !addressData.barangay || !addressData.city || 
            !addressData.province || !addressData.postalCode || !addressData.label ||
            !addressData.contactPerson || !addressData.contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'All address fields are required'
            });
        }

        // Check if this is the first address
        if (!profile.primaryAddress && (!profile.additionalAddresses || !profile.additionalAddresses.length)) {
            // Set as primary address if it's the first one
            profile.primaryAddress = addressData;
        } else {
            // Initialize additionalAddresses if it doesn't exist
            if (!profile.additionalAddresses) {
                profile.additionalAddresses = [];
            }
            
            // Check address limit
            if (profile.additionalAddresses.length >= 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum of 3 additional addresses allowed'
                });
            }

            // Add to additional addresses
            profile.additionalAddresses.push(addressData);
        }

        // Save the updated profile
        await profile.save();

        res.json({
            success: true,
            message: 'Address added successfully',
            profile: {
                primaryAddress: profile.primaryAddress,
                additionalAddresses: profile.additionalAddresses
            }
        });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding address',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};
// Set primary address
export const setPrimaryAddress = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { addressId } = req.params;

        const profile = await UserProfile.findOne({ userId });
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Find the address in additionalAddresses
        const addressToPromote = profile.additionalAddresses.find(
            addr => addr._id.toString() === addressId
        );

        if (!addressToPromote) {
            return res.status(404).json({
                success: false,
                message: 'Address not found in additional addresses'
            });
        }

        // If there's an existing primary address, move it to additionalAddresses
        if (profile.primaryAddress) {
            profile.additionalAddresses.push(profile.primaryAddress);
        }

        // Set the new primary address
        profile.primaryAddress = addressToPromote;

        // Remove the promoted address from additionalAddresses
        profile.additionalAddresses = profile.additionalAddresses.filter(
            addr => addr._id.toString() !== addressId
        );

        // Save the changes
        await profile.save();

        res.json({
            success: true,
            message: 'Primary address updated successfully',
            data: {
                primaryAddress: profile.primaryAddress,
                additionalAddresses: profile.additionalAddresses
            }
        });
    } catch (error) {
        console.error('Set primary address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting primary address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete address
// controllers/profile.js
export const deleteAddress = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { addressId } = req.params;

        // Debug log
        console.log('Delete request:', { userId, addressId });

        const profile = await UserProfile.findOne({ userId });
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Check if address exists before deletion
        const addressExists = profile.additionalAddresses.find(
            addr => addr._id.toString() === addressId
        );

        if (!addressExists) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // FIXED: Use additionalAddresses instead of addresses
        profile.additionalAddresses = profile.additionalAddresses.filter(
            addr => addr._id.toString() !== addressId
        );

        await profile.save();

        res.json({
            success: true,
            message: 'Address deleted successfully',
            data: {
                primaryAddress: profile.primaryAddress,
                additionalAddresses: profile.additionalAddresses
            }
        });

    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete profile


const findUserAuthByUid = async (uid) => {
  const userAuth = await UserAuth.findOne({ firebaseUid: uid })
    .select('+email +role +emailVerified')
    .lean();
    
  if (!userAuth) {
    throw new Error(`User not found with Firebase UID: ${uid}`);
  }
  return userAuth;
};
export const deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
      const { uid } = req.user;

      // Get user data
      const userAuth = await UserAuth.findOne({ firebaseUid: uid });
      if (!userAuth) {
          throw new Error('User not found');
      }

      // Get user profile
      const userProfile = await UserProfile.findOne({ userId: userAuth._id });
      if (!userProfile) {
          throw new Error('Profile not found');
      }

      // Soft delete UserAuth
      await UserAuth.findByIdAndUpdate(
          userAuth._id,
          {
              isDeleted: true,
              deletedAt: new Date(),
              isActive: false
          },
          { session }
      );

      // Soft delete UserProfile
      await UserProfile.findByIdAndUpdate(
          userProfile._id,
          {
              isDeleted: true,
              deletedAt: new Date()
          },
          { session }
      );

      await session.commitTransaction();

      res.json({
          success: true,
          message: 'Account deactivated successfully'
      });

  } catch (error) {
      await session.abortTransaction();
      console.error('Account deletion error:', error);
      res.status(500).json({
          success: false,
          message: 'Error deactivating account'
      });
  } finally {
      session.endSession();
  }
};
const findUserProfile = async (userId) => {
  const userProfile = await UserProfile.findOne({ userId });
  if (!userProfile) {
    throw new Error('Profile not found');
  }
  return userProfile;
};


export const reactivateAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
      const { uid } = req.user;

      // Reactivate UserAuth
      const userAuth = await UserAuth.findOneAndUpdate(
          { firebaseUid: uid },
          {
              isDeleted: false,
              deletedAt: null,
              isActive: true
          },
          { session, new: true }
      );

      if (!userAuth) {
          throw new Error('User not found');
      }

      // Reactivate UserProfile
      await UserProfile.findOneAndUpdate(
          { userId: userAuth._id },
          {
              isDeleted: false,
              deletedAt: null
          },
          { session }
      );

      await session.commitTransaction();

      res.json({
          success: true,
          message: 'Account reactivated successfully'
      });

  } catch (error) {
      await session.abortTransaction();
      console.error('Account reactivation error:', error);
      res.status(500).json({
          success: false,
          message: 'Error reactivating account'
      });
  } finally {
      session.endSession();
  }
};

export const isAccountSoftDeleted = async (uid) => {
  const userAuth = await UserAuth.findOne({ firebaseUid: uid });
  return userAuth?.isDeleted || false;
};

// Middleware to prevent soft-deleted accounts from accessing routes
export const preventSoftDeletedAccess = async (req, res, next) => {
  try {
      const isDeleted = await isAccountSoftDeleted(req.user.uid);
      if (isDeleted) {
          return res.status(403).json({
              success: false,
              message: 'Account is deactivated. Please reactivate your account to continue.'
          });
      }
      next();
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Error checking account status'
      });
  }
};

export const checkAccountStatus = async (req, res, next) => {
    try {
        console.log('User data in middleware:', req.user); // Debug log
  
        const userAuth = await UserAuth.findOne({
            _id: req.user.id,  // Using MongoDB ID
            isDeleted: { $ne: true } // Check if not deleted
        });
  
        console.log('Found UserAuth:', userAuth); // Debug log
  
        if (!userAuth) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated or not found'
            });
        }
  
        // Store the full user auth data for later use
        req.userAuth = userAuth;
        next();
    } catch (error) {
        console.error('Account status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking account status'
        });
    }
  };

export default {
  getUserProfile,
  updateProfile,
  addAddress,
  setPrimaryAddress,
  deleteAddress,
  findUserProfile,
  validateUserAccess ,
  reactivateAccount,
  isAccountSoftDeleted,
  preventSoftDeletedAccess,
  checkAccountStatus
};


