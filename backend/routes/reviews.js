// routes/reviews.js

import express from 'express'; 
import reviewController from '../controllers/reviews.js'; 
import { protect, authorize } from '../middleware/auth.js';  

const router = express.Router();  

// Public routes 
router.get('/product/:productId', reviewController.getProductReviews);  

// Protected routes 
router.use((req, res, next) => {
  console.log('Headers:', req.headers);
  console.log('Authorization:', req.headers.authorization);
  next();
});

router.use(protect);  

router.route('/')   
  .post((req, res, next) => {
    console.log('Create Review Request User:', req.user);
    console.log('Create Review Request Body:', req.body);
    next();
  }, reviewController.createReview)   
  .get(reviewController.getUserReviews);  

router.route('/:reviewId')   
  .put(reviewController.updateReview)   
  .delete(authorize('admin'), reviewController.deleteReview);  

export default router; 
