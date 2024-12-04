import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  version: { type: Number, default: 1 },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAuth',
    required: [true, 'User is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    rating: Number,
    comment: String,
    editedAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// Update product's average rating when review is added/modified
reviewSchema.post('save', async function() {
  const productId = this.product;
  const Product = mongoose.model('Product');
  
  const stats = await this.constructor.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    'metadata.rating': stats[0]?.avgRating || 0,
    'metadata.ratingCount': stats[0]?.ratingCount || 0
  });
});

// Instance methods
reviewSchema.methods = {
  async updateReview(rating, comment) {
    // Store current review in edit history
    this.editHistory.push({
      rating: this.rating,
      comment: this.comment,
      editedAt: new Date()
    });

    // Update review
    this.rating = rating;
    this.comment = comment;
    this.isEdited = true;

    return this.save();
  }
};

// Static methods
reviewSchema.statics = {
  async getProductReviews(productId) {
    return this.find({ product: productId })
      .populate('user', 'displayName photoURL')
      .sort('-createdAt');
  },

  async getUserReviews(userId) {
    return this.find({ user: userId })
      .populate('product', 'name images')
      .sort('-createdAt');
  }
};

const Review = mongoose.model('Review', reviewSchema);
export default Review;