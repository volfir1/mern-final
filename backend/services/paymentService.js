// services/paymentService.js
import Stripe from 'stripe';
import Order from '../models/order.js';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  static async processPayment(orderId, paymentMethod) {
    // Ensure orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID format');
    }

    // Add retry logic for finding the order
    let retries = 3;
    let order = null;
    
    while (retries > 0 && !order) {
      order = await Order.findById(orderId);
      if (!order) {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }

    if (!order) {
      throw new Error(`Order not found with ID: ${orderId}`);
    }

    switch (paymentMethod) {
      case 'STRIPE':
        return await this.processStripePayment(order);
      case 'COD':
        return await this.processCODPayment(order);
      default:
        throw new Error('Invalid payment method');
    }
  }

  static async processStripePayment(order) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'php',
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber
        }
      });

      // Update order with payment intent details
      order.payment = {
        method: 'STRIPE',
        intentId: paymentIntent.id,
        status: paymentIntent.status
      };
      
      await order.save();

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  static async processCODPayment(order) {
    try {
      // Update order payment details
      order.payment = {
        method: 'COD',
        status: 'PENDING'
      };
      order.paymentStatus = 'PENDING';
      order.orderStatus = 'PROCESSING';
      
      // Add status update
      order.statusUpdates.push({
        status: 'PROCESSING',
        date: new Date(),
        note: 'Cash on Delivery payment method confirmed'
      });

      await order.save();

      return {
        success: true,
        message: 'COD order processed successfully'
      };
    } catch (error) {
      console.error('COD processing error:', error);
      throw new Error(`COD processing failed: ${error.message}`);
    }
  }

  static async handleStripeSuccess(paymentIntentId) {
    try {
      const order = await Order.findOne({ 'payment.intentId': paymentIntentId });
      if (!order) {
        throw new Error('Order not found for payment intent');
      }

      order.paymentStatus = 'PAID';
      order.orderStatus = 'PROCESSING';
      order.payment.status = 'succeeded';
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
  }

  static async handleStripeFailure(paymentIntentId, reason) {
    try {
      const order = await Order.findOne({ 'payment.intentId': paymentIntentId });
      if (!order) {
        throw new Error('Order not found for payment intent');
      }

      order.paymentStatus = 'FAILED';
      order.payment.status = 'failed';
      order.statusUpdates.push({
        status: order.orderStatus,
        date: new Date(),
        note: `Payment failed: ${reason || 'Unknown error'}`
      });

      await order.save();
      return order;
    } catch (error) {
      console.error('Payment failure handling error:', error);
      throw new Error('Failed to process payment failure');
    }
  }

  static async getPaymentStatus(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.payment?.method === 'STRIPE' && order.payment?.intentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.payment.intentId
        );

        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          stripeStatus: paymentIntent.status,
          paymentMethod: order.payment.method,
          amount: order.total
        };
      }

      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.payment?.method || order.paymentMethod,
        amount: order.total
      };
    } catch (error) {
      console.error('Get payment status error:', error);
      throw new Error('Failed to get payment status');
    }
  }

  static async verifyWebhookSignature(payload, signature) {
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
  }

  static async handlePaymentActionRequired(paymentIntentId) {
    try {
      const order = await Order.findOne({ 'payment.intentId': paymentIntentId });
      if (!order) {
        throw new Error('Order not found for payment intent');
      }

      order.statusUpdates.push({
        status: order.orderStatus,
        date: new Date(),
        note: 'Additional authentication required for payment'
      });

      await order.save();
      return order;
    } catch (error) {
      console.error('Payment action required handling error:', error);
      throw new Error('Failed to process payment action required');
    }
  }

  static async handlePaymentCancellation(paymentIntentId) {
    try {
      const order = await Order.findOne({ 'payment.intentId': paymentIntentId });
      if (!order) {
        throw new Error('Order not found for payment intent');
      }

      order.paymentStatus = 'CANCELLED';
      order.payment.status = 'cancelled';
      order.orderStatus = 'CANCELLED';
      order.statusUpdates.push({
        status: 'CANCELLED',
        date: new Date(),
        note: 'Payment cancelled'
      });

      await order.save();
      return order;
    } catch (error) {
      console.error('Payment cancellation handling error:', error);
      throw new Error('Failed to process payment cancellation');
    }
  }

  static async handleRefund(orderId, reason) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.payment?.method === 'STRIPE' && order.payment?.intentId) {
        const refund = await stripe.refunds.create({
          payment_intent: order.payment.intentId,
          reason: reason || 'requested_by_customer'
        });

        order.payment.refundId = refund.id;
        order.payment.status = 'refunded';
        order.paymentStatus = 'REFUNDED';
        order.statusUpdates.push({
          status: order.orderStatus,
          date: new Date(),
          note: `Refund processed: ${reason || 'Customer request'}`
        });

        await order.save();
        return { success: true, refund };
      }

      throw new Error('Cannot refund non-Stripe payment');
    } catch (error) {
      console.error('Refund processing error:', error);
      throw new Error('Failed to process refund');
    }
  }
}

export default PaymentService;