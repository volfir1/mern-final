// src/components/ProductCard.jsx

import React, { useMemo } from 'react';
import { Card, CardMedia, CardContent, Typography, Button, Box, Rating, Skeleton } from '@mui/material';
import PropTypes from 'prop-types';
import { Edit, Star } from '@mui/icons-material';

const ProductCard = ({ 
  product, 
  onReview, 
  isReviewed, 
  submitting = false, // Default parameter
  loading = false 
}) => {
  // Return loading skeleton if loading
  if (loading) {
    return (
      <Card className="h-full">
        <Skeleton variant="rectangular" height={200} animation="wave" />
        <CardContent>
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="rectangular" width="100%" height={36} className="mt-4" />
        </CardContent>
      </Card>
    );
  }

  // Return null if no product data
  if (!product) return null;

  // Memoize image URL processing
  const imageUrl = useMemo(() => {
    if (!Array.isArray(product.images) || product.images.length === 0) {
      return '/placeholder.jpg';
    }
    const firstImage = product.images[0];
    return typeof firstImage === 'string' ? firstImage : firstImage?.url || '/placeholder.jpg';
  }, [product.images]);

  // Memoize review data
  const reviewData = useMemo(() => ({
    rating: product.userReview?.rating || 0,
    comment: product.userReview?.comment || ''
  }), [product.userReview]);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      {/* Product Image with error handling */}
      <Box className="relative pt-[75%]">
        <CardMedia
          component="img"
          image={imageUrl}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.jpg';
          }}
        />
      </Box>

      <CardContent className="flex-grow flex flex-col">
        {/* Product Name */}
        <Typography 
          variant="h6" 
          component="h2" 
          className="mb-2 line-clamp-2"
          title={product.name}
        >
          {product.name}
        </Typography>

        {/* Review Section */}
        <Box className="mt-auto space-y-3">
          {isReviewed ? (
            <>
              <Box className="flex items-center gap-2">
                <Rating 
                  value={reviewData.rating}
                  readOnly 
                  size="small"
                  precision={0.5}
                  icon={<Star className="text-yellow-400" size={20} />}
                  emptyIcon={<Star className="text-gray-300" size={20} />}
                />
                <Typography variant="caption" color="text.secondary">
                  Your rating
                </Typography>
              </Box>
              {reviewData.comment && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  className="line-clamp-2"
                  title={reviewData.comment}
                >
                  "{reviewData.comment}"
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={() => onReview(product)}
                fullWidth
                startIcon={<Edit size={16} />}
                className="mt-2"
                disabled={submitting} // Disable while submitting
              >
                {submitting ? 'Updating...' : 'Edit Review'}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={() => onReview(product)}
              fullWidth
              className="mt-2"
              disabled={submitting} // Disable while submitting
            >
              {submitting ? 'Submitting...' : 'Write Review'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    productId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    orderId: PropTypes.string.isRequired,
    userReview: PropTypes.shape({
      _id: PropTypes.string,
      rating: PropTypes.number,
      comment: PropTypes.string
    })
  }).isRequired,
  onReview: PropTypes.func.isRequired,
  isReviewed: PropTypes.bool.isRequired,
  submitting: PropTypes.bool,
  loading: PropTypes.bool
};

export default ProductCard;
