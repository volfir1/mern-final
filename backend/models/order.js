// models/order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  quantity: Number,
  subtotal: Number,
  userReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
    // Removed required: true since we'll generate it
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAuth',
    required: true
  },
  items: [orderItemSchema],
  shippingAddressId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'STRIPE'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  stripePaymentIntentId: String,
  orderStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  statusUpdates: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String
  }],
  subtotal: Number,
  total: Number
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for address
orderSchema.virtual('shippingAddress', {
  ref: 'UserProfile',
  localField: 'user',
  foreignField: 'userId',
  justOne: true
});

// Generate order number
orderSchema.pre('validate', async function(next) {
  try {
    if (!this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const count = await mongoose.model('Order').countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });
      
      this.orderNumber = `ORD-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Track status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus')) {
    this.statusUpdates.push({
      status: this.orderStatus,
      date: new Date(),
      note: this._statusNote || ''
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;