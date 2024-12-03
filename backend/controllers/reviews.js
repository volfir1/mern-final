import Review from '../models/review.js';
import Product from '../models/product.js';

const reviewController = {
  // Create a review
  async createReview(req, res) {
    try {
      const { productId, rating, comment } = req.body;
      
      // Check if user already reviewed
      const existingReview = await Review.findOne({
        user: req.user.id,
        product: productId
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      const review = await Review.create({
        user: req.user.id,
        product: productId,
        rating,
        comment
      });

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
      await review.updateReview(rating, comment);

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
      const review = await Review.findById(req.params.reviewId);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      await review.deleteOne();

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
      const reviews = await Review.find({ product: req.params.productId })
        .populate('user', 'displayName photoURL')
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
      const reviews = await Review.find({ user: req.user.id })
        .populate('product', 'name images')
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

export default reviewController;