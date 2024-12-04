import Review from '../models/reviews.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';
import Order from '../models/order.js'; 

class ReviewController {
  // Utility method to handle async operations
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

  createReview = this.asyncWrapper(async (req, res) => {
    let session = null;
    let review = null;  // Declare review here so it's accessible throughout the function

    try {
      const { productId, orderId, rating, comment } = req.body;
      session = await mongoose.startSession();
      
      await session.withTransaction(async () => {
        // Create the review
        review = new Review({
          user: req.user.id,
          product: productId,
          order: orderId,
          rating,
          comment,
          version: 1
        });
        
        await review.save({ session });

        // Update the order item with the review reference
        const updatedOrder = await Order.findOneAndUpdate(
          { 
            _id: orderId,
            'items.product': productId 
          },
          { 
            $set: { 'items.$.userReview': review._id }
          },
          { 
            session,
            new: true 
          }
        );

        if (!updatedOrder) {
          throw new Error('Failed to update order with review');
        }

        console.log('Review creation:', {
          reviewId: review._id,
          orderId,
          productId,
          orderUpdated: !!updatedOrder
        });

        return review;
      });

      // Fetch the populated review data
      const populatedReview = await Review.findById(review._id)
        .populate('product')
        .populate('order');

      res.status(201).json({
        success: true,
        data: populatedReview
      });

    } catch (error) {
      console.error('Review creation error:', {
        error: error.message,
        productId: req.body.productId,
        orderId: req.body.orderId
      });
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  });


  // Update existing review
  updateReview = this.asyncWrapper(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { reviewId } = req.params;
      const { rating, comment } = req.body;

      // Find the existing review
      const review = await Review.findById(reviewId).session(session);

      if (!review) {
        const error = new Error('Review not found');
        error.status = 404;
        throw error;
      }

      // Ensure user owns the review
      if (review.user.toString() !== req.user.id.toString()) {
        const error = new Error('Not authorized to update this review');
        error.status = 403;
        throw error;
      }

      // Store current review in edit history
      review.editHistory.push({
        rating: review.rating,
        comment: review.comment,
        editedAt: new Date()
      });

      // Update review details
      review.rating = rating;
      review.comment = comment;
      review.isEdited = true;
      review.version += 1;

      // Recalculate product rating
      const productReviews = await Review.find({ 
        product: review.product,
        _id: { $ne: reviewId } 
      });

      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0) + rating;
      const newAverageRating = totalRating / (productReviews.length + 1);

      // Update product rating
      await Product.findByIdAndUpdate(
        review.product, 
        { 
          $set: { 
            'metadata.rating': newAverageRating 
          }
        }, 
        { 
          new: true, 
          session 
        }
      );

      // Save updated review
      await review.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();

      throw error; // Re-throw to be caught by asyncWrapper
    }
  });

  // Get reviews for a specific product
  getProductReviews = this.asyncWrapper(async (req, res) => {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'displayName photoURL')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  });

  // Get user's own reviews
  getUserReviews = this.asyncWrapper(async (req, res) => {
    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name images')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  });

  // Delete a review (admin only)
  deleteReview = this.asyncWrapper(async (req, res) => {
    const { reviewId } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const review = await Review.findById(reviewId).session(session);

      if (!review) {
        const error = new Error('Review not found');
        error.status = 404;
        throw error;
      }

      // Recalculate product rating after deletion
      const remainingReviews = await Review.find({ 
        product: review.product,
        _id: { $ne: reviewId } 
      });

      const newAverageRating = remainingReviews.length 
        ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length 
        : 0;

      // Update product rating
      await Product.findByIdAndUpdate(
        review.product, 
        { 
          $set: { 
            'metadata.rating': newAverageRating,
            'metadata.ratingCount': remainingReviews.length
          }
        }, 
        { 
          new: true, 
          session 
        }
      );

      // Remove the review
      await review.deleteOne({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();

      throw error; // Re-throw to be caught by asyncWrapper
    }
  });
}

export default new ReviewController();