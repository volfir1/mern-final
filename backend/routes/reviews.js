import express from 'express';
import reviewController from '../controllers/reviews.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes (require authentication)
router.use(protect); // Apply authentication to all routes below

// Regular user routes
router.post('/', reviewController.createReview);
router.put('/:reviewId', reviewController.updateReview);
router.get('/user/me', reviewController.getUserReviews);

// Admin only routes
router.delete('/:reviewId', authorize('admin'), reviewController.deleteReview);

export default router;