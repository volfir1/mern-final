// controllers/checkout.js
import CheckoutService from '../services/checkoutService.js';

export const createStripeSession = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const session = await CheckoutService.createStripeSession(orderId, userId);
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Create Stripe session error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error creating Stripe session"
    });
  }
};

export const getStripePublicKey = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        publicKey: process.env.STRIPE_PUBLISHABLE_KEY
      }
    });
  } catch (error) {
    console.error('Get Stripe public key error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error getting Stripe public key"
    });
  }
};

export const getCheckoutStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const result = await CheckoutService.getCheckoutStatus(orderId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get checkout status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error getting checkout status"
    });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const result = await CheckoutService.handleStripeWebhook(req.body, sig);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error processing webhook"
    });
  }
};

export const initiateCheckout = async (req, res) => {
  try {
    const { shippingAddressId, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!shippingAddressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required"
      });
    }

    const result = await CheckoutService.initiateCheckout(
      userId,
      shippingAddressId,
      paymentMethod
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error processing checkout"
    });
  }
};

export const confirmCheckout = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const result = await CheckoutService.confirmCheckout(orderId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Confirm checkout error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error confirming checkout"
    });
  }
};

export const confirmStripePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and payment intent ID are required"
      });
    }

    const result = await CheckoutService.confirmStripePayment(orderId, userId, paymentIntentId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Stripe payment confirmation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error confirming payment"
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const result = await CheckoutService.handleStripeWebhook(req.body, sig);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error processing webhook"
    });
  }
};

export const getStripeConfig = async (req, res) => {
  try {
    const result = await CheckoutService.getStripeConfig();
    res.status(200).json({
      success: true,
      data: {
        publishableKey: result.publishableKey
      }
    });
  } catch (error) {
    console.error('Get Stripe config error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error getting Stripe configuration"
    });
  }
};

export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const result = await CheckoutService.createPaymentIntent(orderId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error creating payment intent"
    });
  }
};

export const cancelCheckout = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const result = await CheckoutService.cancelCheckout(orderId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Cancel checkout error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error cancelling checkout"
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const result = await CheckoutService.getOrderDetails(orderId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error fetching order details"
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await CheckoutService.getUserOrders(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error fetching user orders"
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const userId = req.user.id;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and new status are required"
      });
    }

    const result = await CheckoutService.updateOrderStatus(orderId, userId, status.toUpperCase(), note);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating order status"
    });
  }
};

export default {
  createStripeSession,
  getStripePublicKey,
  getCheckoutStatus,
  handleWebhook,
  initiateCheckout,
  confirmCheckout,
  confirmStripePayment,
  handleStripeWebhook,
  getStripeConfig,
  createPaymentIntent,
  cancelCheckout,
  getOrderDetails,
  getUserOrders,
  updateOrderStatus
};