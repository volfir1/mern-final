// controllers/checkoutController.js
import CheckoutService from '../services/checkoutService.js';
import PaymentService from '../services/paymentService.js';
import orderService from '../services/orderService.js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



export const initiateCheckout = async (req, res) => {
  try {
    const { shippingAddressId, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!shippingAddressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and payment method are required'
      });
    }

    const result = await CheckoutService.initiateCheckout(
      userId,
      shippingAddressId,
      paymentMethod
    );

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      details: error.items // For stock validation errors
    });
  }
};

export const getCheckoutStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const status = await PaymentService.getPaymentStatus(orderId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get checkout status error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const confirmCheckout = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await CheckoutService.confirmCheckout(orderId, userId);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Confirm checkout error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = PaymentService.verifyWebhookSignature(req.body, signature);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await CheckoutService.handlePaymentSuccess(
          event.data.object.metadata.orderId
        );
        break;

      case 'payment_intent.payment_failed':
        await CheckoutService.handlePaymentFailure(
          event.data.object.metadata.orderId,
          event.data.object.last_payment_error?.message || 'Payment failed'
        );
        break;

      case 'payment_intent.requires_action':
        // Handle authentication required
        await CheckoutService.handlePaymentActionRequired(
          event.data.object.metadata.orderId
        );
        break;

      case 'payment_intent.canceled':
        await CheckoutService.handlePaymentCancellation(
          event.data.object.metadata.orderId
        );
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export const cancelCheckout = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    await CheckoutService.cancelCheckout(orderId, userId);

    res.status(200).json({
      success: true,
      message: 'Checkout cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel checkout error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};





export const getStripePublicKey = (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.STRIPE_PUBLIC_KEY
  });
};

export const createStripeSession = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'php',
      metadata: { orderId },
      automatic_payment_methods: {
        enabled: true,
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order status
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'PAID',
          paymentDetails: {
            method: 'STRIPE',
            transactionId: paymentIntentId,
            paidAt: new Date()
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        order
      });
    } else {
      throw new Error('Payment not successful');
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



const handleSuccessfulPayment = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'PAID',
    orderStatus: 'PROCESSING',
    paymentDetails: {
      method: 'STRIPE',
      transactionId: paymentIntent.id,
      paidAt: new Date()
    }
  });
};

const handleFailedPayment = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'FAILED',
    orderStatus: 'CANCELLED',
    paymentDetails: {
      method: 'STRIPE',
      transactionId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message
    }
  });
};

export default {
    initiateCheckout,
    getCheckoutStatus,
    confirmCheckout,
    handleWebhook,
    cancelCheckout,
    getStripePublicKey,
    createStripeSession,
    confirmStripePayment,
    handleSuccessfulPayment,
    handleFailedPayment,

  };
  