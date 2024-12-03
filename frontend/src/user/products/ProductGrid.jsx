// src/components/products/ProductGrid.jsx
import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Rating,
  Chip,
  Collapse,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const ProductGrid = ({ products, onAddToCart }) => {
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState({});
  const [showReviews, setShowReviews] = useState({});

  const getQuantity = (productId) => quantities[productId] || 1;

  const handleQuantityChange = (productId, delta) => {
    const currentQty = getQuantity(productId);
    const newQty = Math.max(1, currentQty + delta);
    setQuantities({ ...quantities, [productId]: newQty });
  };

  const handleAddToCart = async (product) => {
    try {
      setLoading({ ...loading, [product._id]: true });
      await onAddToCart(product, getQuantity(product._id));
      setQuantities({ ...quantities, [product._id]: 1 });
    } catch (error) {
      console.error('Add to cart failed:', error);
    } finally {
      setLoading({ ...loading, [product._id]: false });
    }
  };

  const toggleReviews = (productId) => {
    setShowReviews(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid item xs={12} sm={6} md={4} key={product._id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
              component="img"
              sx={{ height: 200, objectFit: 'cover' }}
              image={product.images?.[0]?.url || '/placeholder.jpg'}
              alt={product.name}
            />
            
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h6" component="h2">
                {product.name}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating value={product.rating || 0} readOnly precision={0.5} size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({product.numReviews || 0} reviews)
                </Typography>
              </Box>

              <Typography variant="h6" color="primary" gutterBottom>
                ₱{product.price?.toFixed(2)}
              </Typography>

              {!product.inStock && (
                <Chip label="Out of Stock" color="error" size="small" />
              )}

              {product.reviews?.length > 0 && (
                <>
                  <Button size="small" onClick={() => toggleReviews(product._id)} sx={{ mt: 2 }}>
                    {showReviews[product._id] ? 'Hide Reviews' : 'Show Reviews'}
                  </Button>

                  <Collapse in={showReviews[product._id]}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recent Reviews
                      </Typography>
                      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                        {product.reviews.map((review) => (
                          <Box key={review._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Rating value={review.rating} readOnly size="small" />
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {review.comment}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Collapse>
                </>
              )}
            </CardContent>

            <CardActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(product._id, -1)}
                  disabled={getQuantity(product._id) <= 1}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography>{getQuantity(product._id)}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(product._id, 1)}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Button
                variant="contained"
                startIcon={<CartIcon />}
                onClick={() => handleAddToCart(product)}
                disabled={loading[product._id] || !product.inStock}
                sx={{ ml: 'auto' }}
              >
                Add to Cart
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

ProductGrid.propTypes = {
  products: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.shape({
      url: PropTypes.string.isRequired
    })),
    inStock: PropTypes.bool,
    rating: PropTypes.number,
    numReviews: PropTypes.number,
    reviews: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      comment: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      user: PropTypes.shape({
        displayName: PropTypes.string,
        photoURL: PropTypes.string
      })
    }))
  })).isRequired,
  onAddToCart: PropTypes.func.isRequired
};

export default ProductGrid;