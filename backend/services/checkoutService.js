// services/checkoutService.js
import Cart from '../models/cart.js';
import Order from '../models/order.js';
import Product from '../models/product.js';
import UserProfile from '../models/userProfile.js';
import PaymentService from './paymentService.js';
import mongoose from 'mongoose';

class CheckoutService {
  static async initiateCheckout(userId, shippingAddressId, paymentMethod) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate cart
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      if (!cart?.items?.length) {
        throw new Error('Cart is empty');
      }

      // Validate address
      const userProfile = await UserProfile.findOne({ userId });
      const address = this.validateAddress(userProfile, shippingAddressId);
      if (!address) {
        throw new Error('Invalid shipping address');
      }

      // Create order
      const order = new Order({
        user: userId,
        items: cart.items.map(item => ({
          product: item.product._id,
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        })),
        shippingAddressId,
        shippingAddress: address,
        paymentMethod,
        subtotal: cart.total,
        total: cart.total,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        _statusNote: 'Order created'
      });

      // Save order and clear cart
      await order.save({ session });
      await cart.clear({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Process payment
      const paymentResult = await PaymentService.processPayment(
        order._id.toString(),
        paymentMethod
      );

      // Update order status if payment is successful
      if (paymentResult.success) {
        order.orderStatus = 'PROCESSING';
        order._statusNote = 'Payment processed successfully';
        await order.save();
      }

      return {
        success: true,
        message: "Order created successfully",
        data: order    // Return the entire order object
      };

    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      console.error('Checkout error:', error);
      throw error;
    }
  }

  static validateAddress(userProfile, addressId) {
    if (!userProfile) return null;

    // Check primary address
    if (userProfile.primaryAddress?._id.toString() === addressId.toString()) {
      return userProfile.primaryAddress;
    }

    // Check additional addresses
    return userProfile.additionalAddresses?.find(
      addr => addr._id.toString() === addressId.toString()
    );
  }

  static async confirmCheckout(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      throw new Error('Order not found');
    }

    // Allow confirmation for both PENDING and PROCESSING statuses
    if (!['PENDING', 'PROCESSING'].includes(order.orderStatus)) {
      throw new Error('Order cannot be confirmed in its current status');
    }

    order.orderStatus = 'PROCESSING';
    order._statusNote = 'Order confirmed by user';
    await order.save();

    return {
      success: true,
      message: "Order confirmed successfully",
      data: order
    };
  }

  static async cancelCheckout(orderId, userId) {
    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId,
      orderStatus: { $nin: ['DELIVERED', 'CANCELLED'] }
    });

    if (!order) {
      throw new Error('Order not found or cannot be cancelled');
    }

    order.orderStatus = 'CANCELLED';
    order.paymentStatus = 'CANCELLED';
    order._statusNote = 'Cancelled by user';
    await order.save();

    return {
      success: true,
      message: "Order cancelled successfully",
      data: order
    };
  }

  static async getOrderDetails(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate('items.product')
      .populate('shippingAddress');

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      success: true,
      data: order
    };
  }

  static async getUserOrders(userId) {
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('items.product');

    return {
      success: true,
      data: orders
    };
  }

  static async updateOrderStatus(orderId, userId, newStatus, note) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      throw new Error('Order not found');
    }

    order.orderStatus = newStatus;
    order._statusNote = note || `Status updated to ${newStatus}`;
    await order.save();

    return {
      success: true,
      message: "Order status updated successfully",
      data: order
    };
  }
}

export default CheckoutService;