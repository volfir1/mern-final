// src/user/reviews/ReviewsTab.jsx
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Grid,
  Typography,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import ProductCard from './ProductCard';
import ReviewModal from './ReviewModal';

const OrderGroup = ({ order, products, onReview, isReviewed }) => (
  <Box className="mb-8 bg-white rounded-lg shadow-sm p-4">
    <Box className="flex items-center justify-between mb-4">
      <Box>
        <Typography variant="h6" className="font-medium">
          Order #{order.orderNumber}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Delivered: {format(new Date(order.updatedAt), 'MMM dd, yyyy')}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {products.length} {isReviewed ? 'Reviewed' : 'To Review'}
      </Typography>
    </Box>
    
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid item xs={12} sm={6} md={4} key={`${order._id}_${product.productId}`}>
          <ProductCard
            product={product}
            onReview={() => onReview({ ...product, orderId: order._id })}
            isReviewed={isReviewed}
          />
        </Grid>
      ))}
    </Grid>
    <Divider className="mt-6" />
  </Box>
);

const ReviewsTab = ({ orders = [], onSubmitReview, submitting = false, loading = false, error = null }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const deliveredOrders = orders
  .filter(order => order.orderStatus === 'DELIVERED')
  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  .map(order => ({
    ...order,
    products: order.items.map(item => ({
      _id: item.product?._id,
      productId: item.product?._id,
      orderId: order._id,
      name: item.name || item.product?.name,
      images: item.product?.images || [],
      userReview: item.userReview ? {
        _id: typeof item.userReview === 'string' ? item.userReview : item.userReview._id,
        rating: typeof item.userReview === 'string' ? 0 : item.userReview.rating,
        comment: typeof item.userReview === 'string' ? '' : item.userReview.comment
      } : null,
      price: item.price,
      quantity: item.quantity
    }))
  }));



  const handleReviewClick = (product) => {
    setSelectedProduct({
      ...product,
      _id: product.productId // Ensure _id is set for backwards compatibility
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      await onSubmitReview({
        ...reviewData,
        productId: selectedProduct.productId,
        orderId: selectedProduct.orderId
      });
      handleCloseModal();
    } catch (error) {
      console.error('Review submission failed:', error);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center py-12">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="my-4">
        {error}
      </Alert>
    );
  }

  if (!deliveredOrders.length) {
    return (
      <Box className="text-center py-12">
        <Typography variant="h6" color="text.secondary">
          No products available for review
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-2">
          Products will appear here after delivery
        </Typography>
      </Box>
    );
  }

  const toReviewCount = deliveredOrders.reduce((count, order) => 
    count + order.products.filter(p => !p.userReview).length, 0);
  const reviewedCount = deliveredOrders.reduce((count, order) => 
    count + order.products.filter(p => p.userReview).length, 0);

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        className="mb-6"
      >
        <Tab label={`To Review (${toReviewCount})`} />
        <Tab label={`Reviewed (${reviewedCount})`} />
      </Tabs>

      {deliveredOrders.map(order => {
      const orderProducts = activeTab === 0 
      ? order.products.filter(p => !p.userReview?._id)
      : order.products.filter(p => p.userReview?._id);

        if (!orderProducts.length) return null;

        return (
          <OrderGroup
            key={order._id}
            order={order}
            products={orderProducts}
            onReview={handleReviewClick}
            isReviewed={activeTab === 1}
          />
        );
      })}

      <ReviewModal
        open={modalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onSubmit={handleSubmitReview}
        submitting={submitting}
      />
    </Box>
  );
};

OrderGroup.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    orderNumber: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired
  }).isRequired,
  products: PropTypes.arrayOf(PropTypes.shape({
    productId: PropTypes.string.isRequired,
    orderId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.array,
    userReview: PropTypes.object,
    price: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired
  })).isRequired,
  onReview: PropTypes.func.isRequired,
  isReviewed: PropTypes.bool.isRequired
};

ReviewsTab.propTypes = {
    orders: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      orderNumber: PropTypes.string.isRequired,
      orderStatus: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(PropTypes.shape({
        product: PropTypes.object,
        name: PropTypes.string,
        price: PropTypes.number,
        quantity: PropTypes.number,
        userReview: PropTypes.oneOfType([
          PropTypes.string, // Allow string (review ID)
          PropTypes.shape({ // Or full review object
            _id: PropTypes.string.isRequired,
            rating: PropTypes.number,
            comment: PropTypes.string
          })
        ])
      })).isRequired
    })),
    onSubmitReview: PropTypes.func.isRequired,
    submitting: PropTypes.bool,
    loading: PropTypes.bool,
    error: PropTypes.string
  };
export default ReviewsTab;