import Review from '../models/reviews.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';
import Order from '../models/order.js';


class ReviewController {
  // Utility method to handle async operations
  debugLog(message, data) {
    console.log(`[ReviewController] ${message}:`, JSON.stringify(data, null, 2));
  }
  
  asyncWrapper(fn) {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        console.error('Review Controller Error:', {
          error: error.message,
          stack: error.stack,
          user: req.user?.id,
          body: req.body
        });
        res.status(error.status || 500).json({
          success: false,
          error: error.message || 'Server Error'
        });
      }
    };
  }

  // Create Review
  createReview = this.asyncWrapper(async (req, res) => {
    let session = null;
    let review = null;

    try {
      const { productId, orderId, rating, comment } = req.body;
      session = await mongoose.startSession();
      
      await session.withTransaction(async () => {
        const existingReview = await Review.findOne({ 
          user: req.user.id, 
          product: productId, 
          order: orderId 
        }).session(session);
        
        if (existingReview) {
          const error = new Error('You have already reviewed this product for this order.');
          error.status = 400;
          throw error;
        }

        review = new Review({
          user: req.user.id,
          product: productId,
          order: orderId,
          rating,
          comment,
          version: 1
        });
        
        await review.save({ session });

        const updatedOrder = await Order.findOneAndUpdate(
          { _id: orderId, 'items.product': productId },
          { $set: { 'items.$.userReview': review._id }},
          { session, new: true }
        );

        if (!updatedOrder) throw new Error('Failed to update order with review');
      });

      const populatedReview = await Review.findById(review._id)
        .populate({
          path: 'user',
          select: 'displayName photoURL',
          populate: {
            path: 'profile',
            select: 'firstName lastName'
          }
        })
        .populate('product')
        .populate('order');

      res.status(201).json({
        success: true,
        data: populatedReview
      });

    } catch (error) {
      console.error('Review creation error:', error);
      if (error.status === 400) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || 'Server Error'
        });
      }
    } finally {
      if (session) await session.endSession();
    }
  });

  updateReview = this.asyncWrapper(async (req, res) => {
    let session = null;
    try {
      // Check auth first
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
  
      const { reviewId } = req.params;
      const { rating, comment } = req.body;
  
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        // Find review
        const review = await Review.findById(reviewId)
          .populate('user')
          .session(session);
  
        if (!review) {
          throw new Error('Review not found');
        }
  
        // Get user IDs as strings
        const reviewUserId = review.user._id.toString();
        const requestUserId = req.user.id.toString();
  
        console.log('Auth check:', {
          reviewUserId,
          requestUserId,
          match: reviewUserId === requestUserId
        });
  
        // Compare string IDs
        if (reviewUserId !== requestUserId) {
          const error = new Error('Not authorized');
          error.status = 403;
          throw error;
        }
  
        // Update review
        review.rating = rating;
        review.comment = comment;
        review.version = (review.version || 0) + 1;
        review.editHistory = review.editHistory || [];
        review.editHistory.push({
          rating,
          comment,
          editedAt: new Date()
        });
  
        await review.save({ session });
  
        const updatedReview = await Review.findById(reviewId)
          .populate('user', 'displayName email photoURL')
          .populate('order', 'orderNumber')
          .session(session);
  
        res.json({
          success: true,
          data: updatedReview
        });
      });
  
    } catch (error) {
      console.error('Review update error:', {
        message: error.message,
        userId: req.user?.id,
        reviewId
      });
  
      res.status(error.status || 500).json({
        success: false,
        message: error.message
      });
    } finally {
      if (session) await session.endSession();
    }
  });

  // Get Product Reviews
  getProductReviews = this.asyncWrapper(async (req, res) => {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate({
        path: 'user',
        select: 'displayName email photoURL',
        populate: {
          path: 'profile',
          select: 'firstName lastName'
        }
      })
      .populate('order', 'orderNumber')
      .sort('-createdAt');

    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        _id: review.user?._id,
        displayName: review.user?.displayName || review.user?.email || 'Anonymous',
        email: review.user?.email,
        photoURL: review.user?.photoURL,
        profile: review.user?.profile
      },
      order: {
        _id: review.order?._id,
        orderNumber: review.order?.orderNumber
      },
      product: review.product,
      version: review.version,
      editHistory: review.editHistory
    }));

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: formattedReviews
    });
  });

  // Get User Reviews
  getUserReviews = this.asyncWrapper(async (req, res) => {
    const reviews = await Review.find({ user: req.user.id })
      .populate({
        path: 'product',
        select: 'name images'
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  });

  // Delete Review
  deleteReview = this.asyncWrapper(async (req, res) => {
    const { reviewId } = req.params;
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const review = await Review.findById(reviewId).session(session);

      if (!review) {
        const error = new Error('Review not found');
        error.status = 404;
        throw error;
      }

      const remainingReviews = await Review.find({ 
        product: review.product,
        _id: { $ne: reviewId } 
      }).session(session);

      const newAverageRating = remainingReviews.length 
        ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length 
        : 0;

      await Product.findByIdAndUpdate(
        review.product, 
        { 
          $set: { 
            'metadata.rating': newAverageRating,
            'metadata.ratingCount': remainingReviews.length
          }
        },
        { new: true, session }
      );

      await review.deleteOne({ session });
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  });
}

export default new ReviewController();