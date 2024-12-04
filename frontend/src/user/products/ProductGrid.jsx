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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Eye } from 'lucide-react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

// Review Card Component for the Modal
const ReviewCard = ({ review }) => (
  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar
          src={review.user?.photoURL}
          alt={review.user?.displayName}
          sx={{ width: 32, height: 32 }}
        >
          {review.user?.displayName?.charAt(0) || 'U'}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {review.user?.displayName || 'Anonymous'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Order #{review.order?.orderNumber} • {format(new Date(review.createdAt), 'MMM dd, yyyy')}
          </Typography>
        </Box>
      </Box>
    </Box>
    <Rating value={review.rating} readOnly size="small" />
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      {review.comment}
    </Typography>
  </Box>
);

// Product Review Modal Component
const ProductReviewModal = ({ open, onClose, product, reviews }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    maxWidth="md" 
    fullWidth
  >
    <DialogTitle>
      Reviews for {product?.name}
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>
      {reviews && reviews.length > 0 ? (
        reviews.map((review) => (
          <ReviewCard key={review._id} review={review} />
        ))
      ) : (
        <Box py={4} textAlign="center">
          <Typography color="text.secondary">No reviews yet</Typography>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

const ProductGrid = ({ products, onAddToCart, reviews = {} }) => {
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

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

  const handleViewReviews = (product) => {
    console.log('Opening reviews for product:', product._id);
    console.log('Available reviews:', reviews[product._id]);
    setSelectedProduct(product);
    setReviewModalOpen(true);
  };

  return (
    <>
      <Grid container spacing={3}>
        {products.map((product) => {
          const productReviews = reviews[product._id] || [];
          const averageRating = productReviews.length > 0
            ? productReviews.reduce((acc, rev) => acc + rev.rating, 0) / productReviews.length
            : 0;

          return (
            <Grid item xs={12} sm={6} md={4} key={product._id}>
              <Card className="h-full flex flex-col hover:shadow-lg transition-duration-200">
                <Box className="relative pt-[75%]">
                  <CardMedia
                    component="img"
                    image={product.images?.[0]?.url || '/api/placeholder/400/300'}
                    alt={product.name}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                  <Box className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <Button
  variant="outlined"
  size="small"
  onClick={() => handleViewReviews(product)}
>
  View Reviews ({(state.reviews[product._id] || []).length})
</Button>
                  </Box>
                </Box>

                <CardContent className="flex-grow flex flex-col">
                  <Typography variant="h6" component="h2" className="font-medium mb-2 line-clamp-2">
                    {product.name}
                  </Typography>

                  <Box className="flex items-center gap-2 mb-2">
                    <Rating value={averageRating} readOnly precision={0.5} size="small" />
                    <Typography variant="body2" color="text.secondary">
                      ({productReviews.length})
                    </Typography>
                  </Box>

                  <Stack direction="row" alignItems="center" justifyContent="space-between" className="mb-2">
                    <Typography variant="h6" color="primary" className="font-semibold">
                      ₱{product.price?.toLocaleString()}
                    </Typography>
                    {product.inStock ? (
                      <Chip label="In Stock" color="success" size="small" />
                    ) : (
                      <Chip label="Out of Stock" color="error" size="small" />
                    )}
                  </Stack>

                  {product.description && (
                    <Typography variant="body2" color="text.secondary" className="mb-4 line-clamp-2">
                      {product.description}
                    </Typography>
                  )}
                </CardContent>

                <CardActions className="p-4 border-t">
                  <Box className="flex items-center gap-1">
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(product._id, -1)}
                      disabled={getQuantity(product._id) <= 1}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" className="w-8 text-center">
                      {getQuantity(product._id)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(product._id, 1)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<CartIcon />}
                    onClick={() => handleAddToCart(product)}
                    disabled={loading[product._id] || !product.inStock}
                    className="ml-auto"
                    size="small"
                  >
                    {loading[product._id] ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <ProductReviewModal
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        reviews={selectedProduct ? reviews[selectedProduct._id] || [] : []}
      />
    </>
  );
};

ProductGrid.propTypes = {
  products: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.shape({
      url: PropTypes.string
    })),
    inStock: PropTypes.bool,
    description: PropTypes.string
  })).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  reviews: PropTypes.object
};

export default ProductGrid;