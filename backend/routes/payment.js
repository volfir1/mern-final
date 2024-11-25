// routes/payment.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Stripe from 'stripe';
import {
    createOrder,
    confirmPayment,
    getOrderStatus,
    handleWebhook
} from '../controllers/payment.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Public route - Stripe webhook
// Must be before any middleware
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    handleWebhook
);

// Apply authentication to all routes below
router.use(protect);

// Apply user authorization
router.use(authorize('user'));

// Order creation and payment routes
router.route('/order')
    .post(createOrder);              // Create new order with payment

// Payment confirmation and status routes
router.route('/confirm')
    .post(confirmPayment);          // Confirm Stripe payment

// Order status route
router.route('/status/:orderId')
    .get(getOrderStatus);           // Get payment/order status

export default router;