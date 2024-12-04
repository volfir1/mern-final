// src/api/reviewApi.js
import api from '@/utils/api';

export const useReviewApi = () => {
  const createReview = async (reviewData) => {
    try {
      const response = await api.post('/reviews', {
        productId: reviewData.productId,
        orderId: reviewData.orderId,
        rating: reviewData.rating,
        comment: reviewData.comment.trim()
      });
      return response.data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  };

  const updateReview = async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, {
        rating: reviewData.rating,
        comment: reviewData.comment.trim()
      });
      return response.data;
    } catch (error) {
      console.error('Update review error:', error);
      throw error;
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Delete review error:', error);
      throw error;
    }
  };

  const getProductReviews = async (productId) => {
    try {
      const response = await api.get(`/reviews/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Get product reviews error:', error);
      throw error;
    }
  };

  const getUserReviews = async () => {
    try {
      const response = await api.get('/reviews');
      return response.data;
    } catch (error) {
      console.error('Get user reviews error:', error);
      throw error;
    }
  };

  const getAllReviews = async () => {
    try {
      const response = await api.get('/reviews/all');
      return response.data;
    } catch (error) {
      console.error('Get all reviews error:', error);
      throw error;
    }
  };


  return {
    createReview,
    updateReview,
    deleteReview,
    getProductReviews,
    getUserReviews,
    getAllReviews
  };
};

export default useReviewApi;