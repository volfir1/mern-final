// src/user/reviews/UserReviews.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Container,
  Button
} from '@mui/material';
import ReviewsTab from './ReviewsTab';
import api from '@/utils/api';
import { toast } from 'react-toastify';

const UserReviews = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      setSubmitting(true);
      setError(null);
  
      const response = await api.post('/reviews', {
        productId: reviewData.productId,
        orderId: reviewData.orderId,
        rating: reviewData.rating,
        comment: reviewData.comment.trim()
      });
  
      if (response.data.success) {
        await fetchOrders(); // Refresh orders to update UI
        toast.success('Review submitted successfully');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (errorMessage.includes('duplicate key error')) {
        toast.error('You have already reviewed this product');
      } else {
        toast.error(errorMessage || 'Failed to submit review');
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <Container maxWidth="lg" className="py-8">
      {error && (
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchOrders}>
              Retry
            </Button>
          }
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      <ReviewsTab 
        orders={orders}
        onSubmitReview={handleReviewSubmit}
        submitting={submitting}
        loading={loading}
        error={error}
      />
    </Container>
  );
};

export default UserReviews;