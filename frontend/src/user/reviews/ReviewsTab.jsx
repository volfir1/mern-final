// src/components/ReviewsTab.jsx

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import ProductCard from './ProductCard';
import ReviewModal from './ReviewModal';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

// OrderGroup Component Definition
const OrderGroup = ({ order, products, onReview, isReviewed }) => (
  <Box className="mb-8 bg-white rounded-lg shadow-sm p-4">
    {/* Order Header */}
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
    
    {/* Products Grid */}
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid item xs={12} sm={6} md={4} key={`${order._id}_${product.productId}`}>
          <ProductCard
            product={product}
            onReview={() => onReview(product)}
            isReviewed={isReviewed}
          />
        </Grid>
      ))}
    </Grid>
  </Box>
);

// OrderGroup PropTypes
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
    images: PropTypes.arrayOf(PropTypes.string),
    userReview: PropTypes.object,
    price: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired
  })).isRequired,
  onReview: PropTypes.func.isRequired,
  isReviewed: PropTypes.bool.isRequired
};

// ReviewsTab Component
const ReviewsTab = ({ orders = [], onSubmitReview, submitting = false, loading = false, error = null }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  // Process orders to extract relevant product information
  const deliveredOrders = orders
    .filter(order => order.orderStatus === 'DELIVERED')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map(order => ({
        ...order,
        products: order.items.map(item => {
            const imageUrl = item.product?.images?.[0]?.url || 
                           item.product?.images?.[0] || 
                           '/placeholder.jpg';

            const hasValidReview = !!item.userReview;

            return {
                _id: item.product?._id,
                productId: item.product?._id,
                orderId: order._id,
                name: item.name || item.product?.name,
                images: [imageUrl],
                userReview: hasValidReview ? item.userReview : null,
                price: item.price,
                quantity: item.quantity,
                hasReview: hasValidReview
            };
        })
    }));

  // Handler for clicking the "Write Review" or "Edit Review" button
  const handleReviewClick = (product) => {
    setSelectedProduct({
      ...product,
      _id: product.productId
    });
    setModalOpen(true);
  };

  // Handler to close the ReviewModal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  // Handler for submitting a review
  const handleSubmitReview = async (reviewData) => {
    try {
      console.log('Submitting review:', {
        ...reviewData,
        productId: selectedProduct.productId,
        orderId: selectedProduct.orderId
      });
  
      await onSubmitReview({
        ...reviewData,
        productId: selectedProduct.productId,
        orderId: selectedProduct.orderId
      });
  
      console.log('Review submitted successfully');
      handleCloseModal();
      
      // Since orders are passed as props, ensure that the parent component refreshes them after submission
      // Alternatively, you can manage orders within this component using state and fetch them here
    } catch (error) {
      console.error('Review submission failed:', {
        error: error.message,
        data: {
          productId: selectedProduct.productId,
          orderId: selectedProduct.orderId
        }
      });
      throw error; // This allows ReviewModal to handle and display the error
    }
  };
  console.log('Sample order item with review:', orders[0]?.items[0]);


  // Function to filter products based on the active tab
  const filterProducts = (products, isReviewed) => {
    return products.filter(product => {
        const hasReview = !!product.userReview;
        return isReviewed === hasReview;
    });
  };

  // Calculate counts for tabs
  const toReviewCount = deliveredOrders.reduce((count, order) => 
    count + filterProducts(order.products, false).length, 0);
  
  const reviewedCount = deliveredOrders.reduce((count, order) => 
    count + filterProducts(order.products, true).length, 0);

  // Loading State
  if (loading) {
    return (
      <Box className="flex justify-center items-center py-12">
        <CircularProgress />
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Alert severity="error" className="my-4">
        {error}
      </Alert>
    );
  }

  // No Orders Available
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

  return (
    <Box>
      {/* Back to Products Button */}
      <Button
        variant="outlined"
        color="primary"
        onClick={() => navigate('/user/products')}
        className="mb-6"
        startIcon={<ArrowBack />}
      >
        Back to Products
      </Button>

      {/* Tabs for "To Review" and "Reviewed" */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        className="mb-6"
      >
        <Tab label={`To Review (${toReviewCount})`} />
        <Tab label={`Reviewed (${reviewedCount})`} />
      </Tabs>

      {/* Render Order Groups based on the active tab */}
      {deliveredOrders.map(order => {
        const orderProducts = filterProducts(order.products, activeTab === 1);

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

      {/* Review Modal */}
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

// ReviewsTab PropTypes
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
        PropTypes.string,
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          rating: PropTypes.number.isRequired,
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
