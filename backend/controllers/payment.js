// controllers/payment.js
import Stripe from 'stripe';
import Order from '../models/order.js';
import Cart from '../models/cart.js';
import UserProfile from '../models/userProfile.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createOrder = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        const userId = req.user._id;

        // 1. Validate payment method
        if (!['COD', 'STRIPE'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method'
            });
        }

        // 2. Get user's cart
        const cart = await Cart.getCartByUser(userId);
        if (!cart?.items?.length) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // 3. Get user's shipping address
        const userProfile = await UserProfile.findOne({ userId });
        if (!userProfile?.primaryAddress) {
            return res.status(400).json({
                success: false,
                message: 'Primary address is required'
            });
        }

        // 4. Create order
        const order = await Order.create({
            user: userId,
            items: cart.items,
            shippingAddress: userProfile.primaryAddress,
            paymentMethod,
            total: cart.total
        });

        // 5. Handle payment based on method
        if (paymentMethod === 'STRIPE') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(cart.total * 100),
                currency: 'php',
                metadata: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber
                }
            });

            order.paymentDetails = {
                stripePaymentIntentId: paymentIntent.id,
                stripeClientSecret: paymentIntent.client_secret
            };
            await order.save();

            await cart.clear();

            return res.status(201).json({
                success: true,
                data: {
                    order,
                    clientSecret: paymentIntent.client_secret
                }
            });
        }

        // For COD
        await cart.clear();

        res.status(201).json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getOrderStatus = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                orderNumber: order.orderNumber,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const order = await Order.findOne({ 
            'paymentDetails.stripePaymentIntentId': paymentIntentId,
            user: req.user._id 
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (paymentIntent.status === 'succeeded') {
            order.paymentStatus = 'PAID';
            order.orderStatus = 'PROCESSING';
            await order.save();

            return res.status(200).json({
                success: true,
                message: "Payment confirmed successfully"
            });
        }

        res.status(400).json({
            success: false,
            message: "Payment not successful"
        });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// controllers/payment.js
export const handleWebhook = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        console.log('🎯 Received webhook event');

        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log('✅ Verified webhook signature');
        console.log('📦 Event Type:', event.type);

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('💰 Processing successful payment:', paymentIntent.id);

                const order = await Order.findOne({
                    'paymentDetails.stripePaymentIntentId': paymentIntent.id
                });

                if (order) {
                    console.log('📋 Updating order:', order._id);
                    order.paymentStatus = 'PAID';
                    order.orderStatus = 'PROCESSING';
                    await order.save();
                    console.log('✅ Order updated successfully');
                } else {
                    console.log('⚠️ No matching order found for payment:', paymentIntent.id);
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                console.log('❌ Processing failed payment:', paymentIntent.id);

                const order = await Order.findOne({
                    'paymentDetails.stripePaymentIntentId': paymentIntent.id
                });

                if (order) {
                    console.log('📋 Updating order status to FAILED:', order._id);
                    order.paymentStatus = 'FAILED';
                    await order.save();
                    console.log('✅ Order updated as failed');
                } else {
                    console.log('⚠️ No matching order found for failed payment:', paymentIntent.id);
                }
                break;
            }
            default:
                console.log('📌 Unhandled event type:', event.type);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('💥 Webhook error:', error.message);
        res.status(400).json({
            success: false,
            message: `Webhook Error: ${error.message}`
        });
    }
};