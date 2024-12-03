import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  getUserStats,
  updateUserPassword,
  toggleUserStatus
} from '../controllers/user.js';
import {
  updateUserValidation,
  updateRoleValidation,
  changePasswordValidation
} from '../middleware/validation.js';
import { createUploadMiddleware, HandleMulterError } from '../middleware/multer.js';

const router = express.Router();

// Protect all routes & restrict specific routes to admin
router.use(protect); // Ensure user is authenticated

// User statistics route (admin only)
router.get('/stats', authorize('admin'), getUserStats);

// Basic CRUD routes
router.route('/')
  .get(authorize('admin'), getAllUsers); // Only admin can get all users

router.route('/:id')
  .get(getUserById) // Any authenticated user can get user details
  .put(
    authorize('admin'), // Only admin can update users
    createUploadMiddleware.profile(), // Use profile upload middleware
    updateUserValidation,
    updateUser
  )
  .delete(authorize('admin'), deleteUser); // Only admin can delete users

// Special operations routes
router.put('/:id/role', 
  authorize('admin'), // Only admin can update user roles
  updateRoleValidation, 
  updateUserRole
);

router.put('/:id/password', 
  changePasswordValidation, // Validation for password changes
  updateUserPassword // Any authenticated user can change their password
);

router.patch('/:id/toggle-status', 
  authorize('admin'), // Only admin can toggle user status
  toggleUserStatus
);

// Error handling middleware for Multer
router.use(HandleMulterError);

// Error handling for undefined routes
router.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

router.get('/users/count', protect, authorize('admin'), async (req, res) => {
  try {
    const count = await UserAuth.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
