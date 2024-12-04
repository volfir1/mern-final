// models/order.js
import mongoose from 'mongoose';

// Counter schema for order numbers
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: Number
});

const Counter = mongoose.model('Counter', counterSchema);

// Order item sub-schema
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  subtotal: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  userReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }
});

// Main order schema
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAuth',
    required: true,
    index: true
  },
  items: {
    type: [orderItemSchema],
    validate: [arr => arr.length > 0, 'Order must have at least one item']
  },
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
    enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
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
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'items.product': 1 });

// Generate order number middleware
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    let retries = 5;
    while (retries > 0) {
      try {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        
        const counter = await Counter.findOneAndUpdate(
          { _id: `order-${dateStr}` },
          { $inc: { seq: 1 } },
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true,
            default: { seq: 1 }
          }
        );

        const proposedNumber = `ORD-${dateStr}-${String(counter.seq).padStart(4, '0')}`;
        const existingOrder = await mongoose.model('Order').findOne({ 
          orderNumber: proposedNumber 
        });
        
        if (!existingOrder) {
          this.orderNumber = proposedNumber;
          break;
        }
        
        retries--;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        if (error.code === 11000 && retries > 1) {
          retries--;
          continue;
        }
        throw error;
      }
    }

    if (!this.orderNumber) {
      throw new Error('Failed to generate unique order number');
    }
  }
  next();
});

// Status tracking middleware
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

// Methods
orderSchema.methods.updateStatus = async function(newStatus, note) {
  this._statusNote = note;
  this.orderStatus = newStatus;
  return this.save();
};

orderSchema.methods.markAsPaid = async function() {
  this.paymentStatus = 'PAID';
  this.orderStatus = 'PROCESSING';
  return this.save();
};

orderSchema.methods.cancel = async function(note) {
  this._statusNote = note;
  this.orderStatus = 'CANCELLED';
  this.paymentStatus = 'CANCELLED';
  return this.save();
};

// Virtuals
orderSchema.virtual('shippingAddress', {
  ref: 'UserProfile',
  localField: 'user',
  foreignField: 'userId',
  justOne: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;