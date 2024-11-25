// services/checkoutService.js
import Cart from '../models/cart.js';
import Order from '../models/order.js';
import Product from '../models/product.js';
import UserProfile from '../models/userProfile.js';
import PaymentService from './paymentService.js';

class CheckoutService {
  static async initiateCheckout(userId, shippingAddressId, paymentMethod) {
    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate and get data
      const { cart, address } = await this.validateCheckoutData(
        userId,
        shippingAddressId,
        paymentMethod
      );

      // 2. Create order
      const order = await this.createOrder(
        userId,
        cart,
        address,
        shippingAddressId,
        paymentMethod,
        session
      );

      // 3. Process payment
      const paymentResult = await PaymentService.processPayment(
        order._id,
        paymentMethod
      );

      // 4. Clear cart
      await cart.clear({ session });

      // Commit transaction
      await session.commitTransaction();

      return {
        order,
        paymentDetails: paymentResult
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async validateCheckoutData(userId, shippingAddressId, paymentMethod) {
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

    // Validate stock
    await this.validateStock(cart.items);

    return { cart, address };
  }

  static validateAddress(userProfile, addressId) {
    if (!userProfile) return null;

    if (userProfile.primaryAddress?._id.toString() === addressId) {
      return userProfile.primaryAddress;
    }

    return userProfile.additionalAddresses?.find(
      addr => addr._id.toString() === addressId
    );
  }

  static async validateStock(items) {
    const insufficientStock = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stockQuantity < item.quantity) {
        insufficientStock.push({
          product: item.product,
          requested: item.quantity,
          available: product?.stockQuantity || 0
        });
      }
    }

    if (insufficientStock.length > 0) {
      throw new Error('Insufficient stock for some items', {
        items: insufficientStock
      });
    }
  }

  static async createOrder(userId, cart, address, shippingAddressId, paymentMethod, session) {
    const order = new Order({
      user: userId,
      orderNumber: await Order.generateOrderNumber(),
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
      paymentStatus: 'PENDING'
    });

    await order.save({ session });
    return order;
  }

  static async handlePaymentSuccess(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    return PaymentService.handleStripeSuccess(order.stripePaymentIntentId);
  }

  static async handlePaymentFailure(orderId, reason) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    return PaymentService.handleStripeFailure(order.stripePaymentIntentId, reason);
  }
}

export default CheckoutService;