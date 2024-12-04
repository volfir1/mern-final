// 1. Update models/review.js
import mongoose from 'mongoose';
import './userAuth.js';  // Import UserAuth model

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAuth',  // Change to UserAuth
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  version: {
    type: Number,
    default: 1
  },
  editHistory: [{
    rating: Number,
    comment: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// 2. Add a pre-find middleware to populate user profile
reviewSchema.pre('find', function() {
  this.populate({
    path: 'user',
    select: 'displayName photoURL email',
    populate: {
      path: 'profile',
      select: 'firstName lastName'
    }
  });
});

reviewSchema.pre(/^find/, function() {  // Change to catch all find operations
  this.populate({
    path: 'user',
    select: 'displayName photoURL email',
    populate: {
      path: 'profile',
      select: 'firstName lastName'
    }
  })
  .populate('order', 'orderNumber');  // Add order population
});
const Review = mongoose.model('Review', reviewSchema);
export default Review;