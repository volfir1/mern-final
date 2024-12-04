// services/orderStatusService.js
import Order from '../models/order.js';
import mongoose from 'mongoose';

export const updateOrderStatus = async (orderId, newStatus, note) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        validateStatusTransition(order.orderStatus, newStatus);

        order.orderStatus = newStatus;
        order.statusNote = note; // Changed from _statusNote
        order.updatedAt = new Date();

        if (newStatus === 'CANCELLED') {
            await handleOrderCancellation(order);
        }

        await order.save();
        return order;
    } catch (error) {
        throw new Error(`Failed to update order status: ${error.message}`);
    }
};
const validateStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        'PENDING': ['PROCESSING', 'CANCELLED'],
        'PROCESSING': ['SHIPPED', 'CANCELLED'],
        'SHIPPED': ['DELIVERED', 'CANCELLED'],
        'DELIVERED': [], // Final state
        'CANCELLED': [] // Final state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
};

const handleOrderCancellation = async (order) => {
    try {
        // Restore stock quantities in a transaction
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            for (const item of order.items) {
                await mongoose.model('Product').findByIdAndUpdate(
                    item.product,
                    { $inc: { stockQuantity: item.quantity } },
                    { session }
                );
            }
            
            if (order.paymentMethod === 'STRIPE' && order.paymentStatus === 'PAID') {
                // TODO: Implement Stripe refund logic
                // await stripeService.refundPayment(order.stripePaymentId);
            }

            order.paymentStatus = 'CANCELLED';
            order.cancellationDate = new Date();
            await order.save({ session });
        });
        await session.endSession();
    } catch (error) {
        throw new Error(`Failed to process cancellation: ${error.message}`);
    }
};

export default {
    updateOrderStatus,
    validateStatusTransition, // Optional, if you want to expose it
    handleOrderCancellation, // Optional, if you want to expose it
};
