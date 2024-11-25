// services/orderStatusService.js
import Order from '../models/order.js';

export const updateOrderStatus = async (orderId, newStatus, note) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    // Validate status transition
    validateStatusTransition(order.orderStatus, newStatus);

    // Update order status
    order.orderStatus = newStatus;
    order._statusNote = note;
    
    if (newStatus === 'CANCELLED') {
        await handleOrderCancellation(order);
    }

    await order.save();
    return order;
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
    // Restore stock quantities
    for (const item of order.items) {
        await mongoose.model('Product').updateOne(
            { _id: item.product },
            { $inc: { stockQuantity: item.quantity } }
        );
    }

    // If it was a Stripe payment, handle refund if necessary
    if (order.paymentMethod === 'STRIPE' && order.paymentStatus === 'PAID') {
        // Add refund logic here if needed
    }

    order.paymentStatus = 'CANCELLED';
};

export default {
    updateOrderStatus,
    validateStatusTransition, // Optional, if you want to expose it
    handleOrderCancellation, // Optional, if you want to expose it
};
