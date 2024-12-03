import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    createOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    handleStripeWebhook,
    getAllOrders
} from '../controllers/order.js';

const router = express.Router();

// Base path is already /api/orders from app.js/index.js

// Public route - Stripe webhook
router.post('/webhook', handleStripeWebhook);

// Protected routes - require authentication
router.use(protect);

// Admin routes (place these first to avoid route conflicts)
router.get('/admin/orders', authorize('admin'), getAllOrders);
router.patch('/:orderId/status', authorize('admin'), updateOrderStatus);

// Log middleware for debugging
router.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.baseUrl}${req.path}`, {
        params: req.params,
        body: req.body
    });
    next();
});

// User routes
router.route('/')
    .post(authorize('user'), createOrder)
    .get(authorize('user'), getUserOrders);

router.route('/:orderId')
    .get(authorize('user'), getOrderById);

export default router;