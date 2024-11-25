// services/paymentService.js
import Stripe from 'stripe';
import Order from '../models/order.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Main payment processor
export const processPayment = async (orderId, paymentMethod) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    switch (paymentMethod) {
        case 'STRIPE':
            return await processStripePayment(order);
        case 'COD':
            return await processCODPayment(order);
        default:
            throw new Error('Invalid payment method');
    }
};

// Process Stripe payments
const processStripePayment = async (order) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.total * 100), // Convert to cents
            currency: 'php',
            metadata: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber
            }
        });

        order.stripePaymentIntentId = paymentIntent.id;
        order.paymentStatus = 'PENDING';
        order.paymentMethod = 'STRIPE';
        await order.save();

        return {
            success: true,
            clientSecret: paymentIntent.client_secret
        };
    } catch (error) {
        console.error('Stripe payment error:', error);
        throw new Error('Payment processing failed');
    }
};

// Process COD payments
const processCODPayment = async (order) => {
    try {
        order.paymentStatus = 'PENDING';
        order.orderStatus = 'PROCESSING';
        order.paymentMethod = 'COD';
        await order.save();

        return {
            success: true,
            message: 'COD order processed successfully'
        };
    } catch (error) {
        console.error('COD processing error:', error);
        throw new Error('COD processing failed');
    }
};

// Handle successful Stripe payment
export const handleStripeSuccess = async (paymentIntentId) => {
    try {
        const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!order) {
            throw new Error('Order not found for payment intent');
        }

        order.paymentStatus = 'PAID';
        order.orderStatus = 'PROCESSING';
        order.statusUpdates.push({
            status: 'PROCESSING',
            date: new Date(),
            note: 'Payment received successfully'
        });

        await order.save();
        return order;
    } catch (error) {
        console.error('Payment success handling error:', error);
        throw new Error('Failed to process successful payment');
    }
};

// Handle failed Stripe payment
export const handleStripeFailure = async (paymentIntentId, reason) => {
    try {
        const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!order) {
            throw new Error('Order not found for payment intent');
        }

        order.paymentStatus = 'FAILED';
        order.statusUpdates.push({
            status: order.orderStatus,
            date: new Date(),
            note: `Payment failed: ${reason}`
        });

        await order.save();
        return order;
    } catch (error) {
        console.error('Payment failure handling error:', error);
        throw new Error('Failed to process payment failure');
    }
};

// Get payment status
export const getPaymentStatus = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.paymentMethod === 'STRIPE' && order.stripePaymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
                order.stripePaymentIntentId
            );

            return {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentStatus: order.paymentStatus,
                stripeStatus: paymentIntent.status,
                paymentMethod: order.paymentMethod,
                amount: order.total
            };
        }

        return {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            amount: order.total
        };
    } catch (error) {
        console.error('Get payment status error:', error);
        throw new Error('Failed to get payment status');
    }
};

// Verify Stripe webhook signature
export const verifyWebhookSignature = (payload, signature) => {
    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        throw new Error('Invalid webhook signature');
    }
};

export default {
    processPayment,
    handleStripeSuccess,
    handleStripeFailure,
    getPaymentStatus,
    verifyWebhookSignature
};