// src/components/OrderGroup.jsx

import React from 'react';
import {
  Box,
  Grid,
  Typography
} from '@mui/material';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import ProductCard from './ProductCard';

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

// PropTypes for OrderGroup
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
    userReview: PropTypes.shape({
      _id: PropTypes.string,
      rating: PropTypes.number,
      comment: PropTypes.string
    }),
    price: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired
  })).isRequired,
  onReview: PropTypes.func.isRequired,
  isReviewed: PropTypes.bool.isRequired
};

export default OrderGroup;
