// routes/checkoutRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  initiateCheckout,
  getCheckoutStatus,
  confirmCheckout,
  cancelCheckout,
  handleWebhook,
  createStripeSession,    // Add this
  getStripePublicKey,     // Add this
  confirmStripePayment    // Add this
} from '../controllers/checkout.js';

const router = express.Router();

// Public routes
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Get Stripe public key
router.get('/config', getStripePublicKey);

// Protected routes
router.use(protect);
router.use(authorize('user'));

// Checkout routes
router.post('/', initiateCheckout);
router.get('/:orderId/status', getCheckoutStatus);
router.post('/:orderId/confirm', confirmCheckout);
router.post('/:orderId/cancel', cancelCheckout);

// Stripe specific routes
router.post('/create-payment-intent', createStripeSession);
router.post('/confirm-payment', confirmStripePayment);

export default router;