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
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { Eye } from 'lucide-react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import ProductReviewModal from './ProductReviewModal';

const ProductGrid = ({ products, onAddToCart }) => {
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
    setSelectedProduct(product);
    setReviewModalOpen(true);
  };

  return (
    <>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product._id}>
            <Card className="h-full flex flex-col hover:shadow-lg transition-duration-200">
              {/* Product Image with Hover Overlay */}
              <Box className="relative pt-[75%]">
                <CardMedia
                  component="img"
                  image={product.images?.[0]?.url || '/placeholder.jpg'}
                  alt={product.name}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder.jpg';
                  }}
                />
                <Box className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <Button
                    variant="contained"
                    onClick={() => handleViewReviews(product)}
                    startIcon={<Eye size={18} />}
                    className="bg-white text-gray-800 hover:bg-gray-100"
                  >
                    View Reviews
                  </Button>
                </Box>
              </Box>

              <CardContent className="flex-grow flex flex-col">
                {/* Product Title */}
                <Typography variant="h6" component="h2" className="font-medium mb-2 line-clamp-2">
                  {product.name}
                </Typography>

                {/* Rating and Review Count */}
                <Box className="flex items-center gap-2 mb-2">
                  <Rating value={product.rating || 0} readOnly precision={0.5} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({product.numReviews || 0})
                  </Typography>
                </Box>

                {/* Price and Stock Status */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="mb-2">
                  <Typography variant="h6" color="primary" className="font-semibold">
                    ₱{product.price?.toLocaleString()}
                  </Typography>
                  {!product.inStock ? (
                    <Chip label="Out of Stock" color="error" size="small" />
                  ) : product.stockQuantity <= (product.lowStockThreshold || 5) ? (
                    <Chip label="Low Stock" color="warning" size="small" />
                  ) : (
                    <Chip label="In Stock" color="success" size="small" />
                  )}
                </Stack>

                {/* Short Description */}
                {product.shortDescription && (
                  <Typography variant="body2" color="text.secondary" className="mb-4 line-clamp-2">
                    {product.shortDescription}
                  </Typography>
                )}
              </CardContent>

              <CardActions className="p-4 border-t">
                {/* Quantity Controls */}
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
                    disabled={getQuantity(product._id) >= (product.stockQuantity || 99)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Add to Cart Button */}
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
        ))}
      </Grid>

      {/* Review Modal */}
      <ProductReviewModal
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        reviews={selectedProduct?.reviews || []}
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
      url: PropTypes.string.isRequired
    })),
    inStock: PropTypes.bool,
    stockQuantity: PropTypes.number,
    lowStockThreshold: PropTypes.number,
    rating: PropTypes.number,
    numReviews: PropTypes.number,
    shortDescription: PropTypes.string,
    reviews: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      comment: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      order: PropTypes.shape({
        orderNumber: PropTypes.string.isRequired
      }),
      user: PropTypes.shape({
        displayName: PropTypes.string,
        photoURL: PropTypes.string,
        email: PropTypes.string
      })
    }))
  })).isRequired,
  onAddToCart: PropTypes.func.isRequired
};

export default ProductGrid;