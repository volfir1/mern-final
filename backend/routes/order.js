// routes/orderRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    createOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    handleStripeWebhook
} from '../controllers/order.js';

const router = express.Router();

// Public route - Stripe webhook
router.post('/webhook', handleStripeWebhook);

// Protected routes - require authentication
router.use(protect); // Apply authentication to all routes below

// User routes
router.route('/')
    .post(authorize('user'), createOrder)           // Create new order
    .get(authorize('user'), getUserOrders);         // Get user's orders

router.route('/:orderId')
    .get(authorize('user'), getOrderById);          // Get specific order

// Admin routes
router.route('/:orderId/status')
    .patch(authorize('admin'), updateOrderStatus);   // Update order status (admin only)
    

export default router;