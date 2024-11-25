// routes/profileRoutes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import { checkAccountStatus } from '../controllers/profile.js';
import {
    getUserProfile,
    updateProfile,
    addAddress,
    setPrimaryAddress,
    deleteAddress,
    deleteAccount,
    profileValidation, // You already have this in your controller
    reactivateAccount,
    isAccountSoftDeleted,
    preventSoftDeletedAccess
} from '../controllers/profile.js';
import { handleValidation } from '../middleware/validation.js';
import { createUploadMiddleware } from '../middleware/multer.js';
const router = express.Router();

// Apply protection and account status check to all routes
router.use(protect);
router.use(checkAccountStatus);

// Profile routes
router.get('/me', getUserProfile);
router.put('/me', 
    createUploadMiddleware.profile(),
    profileValidation,
    handleValidation,
    updateProfile
);
router.delete('/me', deleteAccount);
router.post('/reactivate', reactivateAccount);

// Address routes
router.post('/address', addAddress);
router.put('/address/:addressId/primary', setPrimaryAddress);
router.delete('/address/:addressId', deleteAddress);

export default router;