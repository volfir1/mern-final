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
  TextField,
  Chip,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types'; // Add prop-types for better validation

const ProductGrid = ({ products, onAddToCart }) => {
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState({});

  // Safe quantity getter with default value of 1
  const getQuantity = (productId) => quantities[productId] || 1;

  // Handle quantity change
  const handleQuantityChange = (productId, newValue) => {
    const value = parseInt(newValue, 10);
    if (isNaN(value)) return;
    
    const quantity = Math.max(1, Math.min(99, value));
    setQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  // Handle add to cart with loading state
  const handleAddToCart = async (product) => {
    if (!onAddToCart) {
      console.error('onAddToCart prop is not provided');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [product._id]: true }));
      await onAddToCart(product, getQuantity(product._id));
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoading(prev => ({ ...prev, [product._id]: false }));
    }
  };

  if (!Array.isArray(products)) {
    console.error('Products must be an array');
    return null;
  }

  return (
    <Grid container spacing={3}>
      {products.map((product) => {
        const isItemLoading = loading[product._id];
        const currentQuantity = getQuantity(product._id);

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 3,
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={product.images?.[0]?.url || '/placeholder.png'}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2">
                  {product.name}
                </Typography>
                
                <Typography variant="h6" color="primary" gutterBottom>
                  ${product.price?.toFixed(2)}
                </Typography>

                {!product.inStock && (
                  <Chip 
                    label="Out of Stock" 
                    color="error" 
                    size="small" 
                    sx={{ mt: 1 }} 
                  />
                )}

                <Box sx={{ mt: 2 }}>
                  <Rating 
                    value={product.rating || 0} 
                    readOnly 
                    precision={0.5}
                    size="small"
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2 }}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1,
                    gap: 1 
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(
                        product._id, 
                        currentQuantity - 1
                      )}
                      disabled={currentQuantity <= 1 || !product.inStock || isItemLoading}
                    >
                      <RemoveIcon />
                    </IconButton>

                    <TextField
                      size="small"
                      value={currentQuantity}
                      onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                      inputProps={{
                        min: 1,
                        max: 99,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 60 }}
                      disabled={!product.inStock || isItemLoading}
                    />

                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(
                        product._id, 
                        currentQuantity + 1
                      )}
                      disabled={!product.inStock || isItemLoading}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<CartIcon />}
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock || isItemLoading}
                  >
                    {isItemLoading ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
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
  })).isRequired,
  onAddToCart: PropTypes.func.isRequired,
};

export default ProductGrid;