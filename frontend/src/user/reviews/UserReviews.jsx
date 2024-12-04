// src/user/reviews/UserReviews.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Container,
  Button,
  Typography,
  Skeleton,
  Pagination
} from '@mui/material';
import ReviewsTab from './ReviewsTab';
import { useReviewApi } from '@/api/reviewApi';
import { toast } from 'react-toastify';
import api from '@/utils/api';

const ITEMS_PER_PAGE = 10;

const LoadingSkeleton = () => (
  <Box className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} variant="rectangular" height={100} />
    ))}
  </Box>
);

const UserReviews = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  
  const reviewApi = useReviewApi();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/orders');
      
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReviewSubmit = useCallback(async (reviewData) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError(null);
  
      console.log('Processing review submission:', reviewData);
  
      if (reviewData.reviewId) {
        await reviewApi.updateReview(reviewData.reviewId, {
          rating: reviewData.rating,
          comment: reviewData.comment.trim()
        });
        toast.success('Review updated successfully');
      } else {
        await reviewApi.createReview({
          productId: reviewData.productId,
          orderId: reviewData.orderId,
          rating: reviewData.rating,
          comment: reviewData.comment.trim()
        });
        toast.success('Review submitted successfully');
      }
  
      // Fetch orders after a short delay to ensure backend processing is complete
      setTimeout(() => {
        fetchOrders();
      }, 500);
  
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      toast.error(errorMessage || 'Failed to submit review');
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, reviewApi, fetchOrders]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [orders, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <Container maxWidth="lg" className="py-8">
        <LoadingSkeleton />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" className="mb-6">
        Your Reviews
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchOrders}
              disabled={loading || submitting}
            >
              Retry
            </Button>
          }
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      <ReviewsTab 
        orders={paginatedOrders}
        onSubmitReview={handleReviewSubmit}
        submitting={submitting}
        loading={loading}
        error={error}
      />

      {orders.length > ITEMS_PER_PAGE && (
        <Box className="mt-4 flex justify-center">
          <Pagination
            count={Math.ceil(orders.length / ITEMS_PER_PAGE)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default UserReviews;