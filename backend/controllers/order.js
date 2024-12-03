// controllers/order.js
import Order from '../models/order.js';
import Cart from '../models/cart.js';
import UserProfile from '../models/userProfile.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createOrder = async (req, res) => {
    try {
        const { shippingAddressId, paymentMethod } = req.body;
        const userId = req.user.id;

        if (!shippingAddressId || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: "Shipping address and payment method are required"
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // Get user's profile and validate address
        const userProfile = await UserProfile.findOne({ userId });
        
        // Check primary address
        const isPrimaryAddress = userProfile.primaryAddress?._id.toString() === shippingAddressId;
        
        // Check additional addresses
        const isInAdditionalAddresses = userProfile.additionalAddresses?.some(
            addr => addr._id.toString() === shippingAddressId
        );

        if (!isPrimaryAddress && !isInAdditionalAddresses) {
            return res.status(400).json({
                success: false,
                message: "Invalid shipping address. Address not found in user's saved addresses"
            });
        }

        // Create order - orderNumber will be generated automatically in pre-save middleware
        const order = new Order({
            user: userId,
            shippingAddressId: shippingAddressId,
            paymentMethod,
            items: cart.items.map(item => ({
                product: item.product._id,
                name: item.product.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal
            })),
            subtotal: cart.total,
            total: cart.total,
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING'
        });

        // Handle Stripe payment if selected
        if (paymentMethod === 'STRIPE') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(cart.total * 100),
                currency: 'php',
                metadata: {
                    orderId: order._id.toString()
                }
            });
            order.stripePaymentIntentId = paymentIntent.id;
        }

        await order.save();
        await cart.clear();
        await order.populate('shippingAddress');

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error creating order",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const query = { user: userId };
        if (status) {
            query.orderStatus = status.toUpperCase();
        }

        const orders = await Order.find(query)
            .populate('user', 'email')
            .populate({
                path: 'items.product',
                select: 'name price images'
            })
            .populate('shippingAddress')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching orders"
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await Order.findById(orderId)
            .populate('user', 'email')
            .populate({
                path: 'items.product',
                select: 'name price images'
            })
            .populate('shippingAddress');

        if (!order || (order.user._id.toString() !== userId && req.user.role !== 'admin')) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching order"
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, note } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        order.orderStatus = status;
        order._statusNote = note;
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error updating order status"
        });
    }
};

export const handleStripeWebhook = async (req, res) => {
    try {
        const event = req.body;

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                const order = await Order.findOne({ 
                    stripePaymentIntentId: paymentIntent.id 
                });
                
                if (order) {
                    order.paymentStatus = 'PAID';
                    order.orderStatus = 'PROCESSING';
                    order._statusNote = 'Payment received';
                    await order.save();
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                const order = await Order.findOne({ 
                    stripePaymentIntentId: paymentIntent.id 
                });
                
                if (order) {
                    order.paymentStatus = 'FAILED';
                    order._statusNote = paymentIntent.last_payment_error?.message || 'Payment failed';
                    await order.save();
                }
                break;
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({
            success: false,
            message: `Webhook Error: ${error.message}`
        });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'email')
            .populate({
                path: 'items.product',
                select: 'name price images'
            })
            .populate('shippingAddress')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching orders"
        });
    }
};
// Export all controller functions
export default {
    getAllOrders,
    createOrder,
    getUserOrders,     // Added this export
    getOrderById,
    updateOrderStatus,
    handleStripeWebhook
};