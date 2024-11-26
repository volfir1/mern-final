import express from 'express';
import * as userController from '../controllers/userController.js';
import { restrictTo } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = express.Router();

// Profile routes
router.route('/profile')
    .get(userController.getProfile)
    .post(userController.createProfile)
    .patch(userController.updateProfile)
    .delete(userController.deleteProfile);

// Profile image routes
router.route('/profile/image')
    .post(uploadImage.single('image'), userController.uploadProfileImage)
    .delete(userController.deleteProfileImage);

// Admin only routes
router.get('/search', restrictTo('admin'), userController.searchProfiles);
router.get('/:userId', restrictTo('admin'), userController.getProfileById);

export default router;