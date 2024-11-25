// models/payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAuth',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['COD', 'STRIPE'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  currency: {
    type: String,
    default: 'PHP'
  },
  stripe: {
    paymentIntentId: String,
    clientSecret: String,
    chargeId: String,
    receiptUrl: String,
    refundId: String,
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  cod: {
    collectedAt: Date,
    collectedBy: String,
    receiptNumber: String
  },
  refund: {
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED']
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAuth'
    }
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']
    },
    detail: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    attempts: {
      type: Number,
      default: 0
    },
    lastAttempt: Date
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ order: 1 }, { unique: true });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ 'stripe.paymentIntentId': 1 });

// Update status history on status change
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Instance methods
paymentSchema.methods = {
  async processStripePayment(paymentIntentId) {
    this.stripe.paymentIntentId = paymentIntentId;
    this.status = 'PROCESSING';
    this.metadata.attempts += 1;
    this.metadata.lastAttempt = new Date();
    return this.save();
  },

  async completeStripePayment(stripeCharge) {
    this.status = 'COMPLETED';
    this.stripe.chargeId = stripeCharge.id;
    this.stripe.receiptUrl = stripeCharge.receipt_url;
    this.stripe.last4 = stripeCharge.payment_method_details.card.last4;
    this.stripe.brand = stripeCharge.payment_method_details.card.brand;
    this.stripe.expiryMonth = stripeCharge.payment_method_details.card.exp_month;
    this.stripe.expiryYear = stripeCharge.payment_method_details.card.exp_year;
    return this.save();
  },

  async completeCodPayment(collectorInfo) {
    this.status = 'COMPLETED';
    this.cod.collectedAt = new Date();
    this.cod.collectedBy = collectorInfo;
    this.cod.receiptNumber = `COD${Date.now()}`;
    return this.save();
  },

  async initiateRefund(amount, reason, processedBy) {
    if (this.status !== 'COMPLETED') {
      throw new Error('Only completed payments can be refunded');
    }

    this.refund = {
      amount,
      reason,
      status: 'PENDING',
      processedBy
    };
    this.status = 'REFUNDED';
    return this.save();
  }
};

// Static methods
paymentSchema.statics = {
  async getPaymentsByUser(userId) {
    return this.find({ user: userId })
      .sort('-createdAt')
      .populate('order');
  },

  async getPaymentStats(startDate, endDate) {
    return this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
  }
};

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;