import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    createOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    handleStripeWebhook,
    getAllOrders // Add this import
} from '../controllers/order.js';

const router = express.Router();

// Public route - Stripe webhook
router.post('/webhook', handleStripeWebhook);

// Protected routes - require authentication
router.use(protect);

// Admin routes (place these first to avoid route conflicts)
router.get('/admin/orders', authorize('admin'), getAllOrders);
router.patch('/:orderId/status', authorize('admin'), updateOrderStatus);

// User routes
router.route('/')
    .post(authorize('user'), createOrder)
    .get(authorize('user'), getUserOrders);

router.route('/:orderId')
    .get(authorize('user'), getOrderById);

export default router;