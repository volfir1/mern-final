import Review from '../models/reviews.js';
import Product from '../models/product.js';
import Order from '../models/order.js';

const reviewController = {
  // Create a review
  async createReview(req, res) {
    try {
      const { productId, orderId, rating, comment } = req.body;
  
      // Validate order exists and belongs to user
      const order = await Order.findOne({
        _id: orderId,
        user: req.user.id,
        orderStatus: 'DELIVERED'
      });
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or not delivered'
        });
      }
  
      // Check if product exists in order
      const orderItem = order.items.find(
        item => item.product.toString() === productId
      );
  
      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: 'Product not found in this order'
        });
      }
  
      // Create review (removed existing review check)
      const review = await Review.create({
        user: req.user.id,
        product: productId,
        order: orderId,
        rating,
        comment
      });
  
      // Update order item with review reference
      await Order.findOneAndUpdate(
        { 
          _id: orderId,
          'items.product': productId 
        },
        { 
          $set: { 
            'items.$.userReview': review._id 
          }
        }
      );
  
      // Populate user info
      await review.populate('user', 'displayName photoURL');
  
      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },


  // Update review
  async updateReview(req, res) {
    try {
      const review = await Review.findOne({
        _id: req.params.reviewId,
        user: req.user.id
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or unauthorized'
        });
      }

      const { rating, comment } = req.body;

      // Save previous version in history
      review.editHistory.push({
        rating: review.rating,
        comment: review.comment,
        editedAt: new Date()
      });

      // Update review
      review.rating = rating;
      review.comment = comment;
      review.isEdited = true;

      await review.save();

      // Update product rating
      await updateProductRating(review.product);

      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },
  // Delete review (admin only)
  async deleteReview(req, res) {
    try {
      const review = await Review.findOne({
        _id: req.params.reviewId,
        user: req.user.id
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or unauthorized'
        });
      }

      // Remove review reference from order
      await Order.findOneAndUpdate(
        { 
          _id: review.order,
          'items.userReview': review._id 
        },
        { 
          $unset: { 
            'items.$.userReview': 1 
          }
        }
      );

      await review.deleteOne();

      // Update product rating
      await updateProductRating(review.product);

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },
  // Get product reviews
  async getProductReviews(req, res) {
    try {
      const reviews = await Review.find({ 
        product: req.params.productId 
      })
      .populate('user', 'displayName photoURL')
      .populate('order', 'orderNumber')
      .sort('-createdAt');

      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get user reviews
  async getUserReviews(req, res) {
    try {
      const reviews = await Review.find({ 
        user: req.user.id 
      })
      .populate('product', 'name images')
      .populate('order', 'orderNumber')
      .sort('-createdAt');

      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};


// Helper function to update product rating
async function updateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { 
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    rating: stats[0]?.avgRating || 0,
    numReviews: stats[0]?.numReviews || 0
  });
}

export default reviewController;