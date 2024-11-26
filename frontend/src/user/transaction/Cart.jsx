import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi } from '@/api/cartApi';
import { toast } from 'react-toastify';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ArrowLeft
} from 'lucide-react';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const navigate = useNavigate();

  // Cart Fetching Logic
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartApi.getCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    window.addEventListener('cart-updated', fetchCart);
    return () => window.removeEventListener('cart-updated', fetchCart);
  }, []);

  // Cart Update Handler
  const handleUpdateQuantity = async (productId, currentQuantity, change) => {
    const cartItem = cart?.items?.find(item => {
      const itemId = item.product?._id || item.product;
      const searchId = productId?.toString().trim();
      const itemProductId = itemId?.toString().trim();
      return itemProductId === searchId;
    });

    if (!cartItem) {
      toast.error('Item not found in cart');
      return;
    }

    try {
      setUpdatingItemId(productId);
      const newQuantity = Math.max(1, currentQuantity + change);
      const targetProductId = cartItem.product?._id || cartItem.product;
      const response = await cartApi.updateCartItem(targetProductId.toString(), newQuantity);
      
      if (response.success) {
        setCart(response.data);
        toast.success('Cart updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update cart');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update quantity');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Remove Item Handler
  const handleRemoveItem = async (productId) => {
    const cartItem = cart?.items?.find(item => {
      const itemId = item.product?._id || item.product;
      const searchId = productId?.toString().trim();
      const itemProductId = itemId?.toString().trim();
      return itemProductId === searchId;
    });

    if (!cartItem) {
      toast.error('Item not found in cart');
      return;
    }

    try {
      setUpdatingItemId(productId);
      const targetProductId = cartItem.product?._id || cartItem.product;
      const response = await cartApi.removeCartItem(targetProductId.toString());
      
      if (response.success) {
        setCart(response.data);
        toast.success('Item removed from cart');
      } else {
        throw new Error(response.message || 'Failed to remove item');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to remove item');
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <Container maxWidth="lg" className="py-8 mt-16">
      <Paper elevation={0} className="p-6 rounded-lg">
        {/* Header */}
        <Box className="flex items-center justify-between mb-6">
          <Box className="flex items-center space-x-4">
            <IconButton
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-6 w-6" />
            </IconButton>
            <Typography variant="h4" component="h1" className="font-bold">
              Shopping Cart
            </Typography>
          </Box>
          <Typography variant="body1" className="text-gray-600">
            {cart?.itemCount || 0} items
          </Typography>
        </Box>

        <Divider className="mb-6" />

        {/* Cart Content */}
        <Box className="space-y-6">
          {loading ? (
            <Box className="flex items-center justify-center py-12">
              <CircularProgress />
            </Box>
          ) : !cart?.items?.length ? (
            <Box className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
              <Typography variant="h6" className="text-gray-500 mb-4">
                Your cart is empty
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/user/products')}
                className="px-6"
              >
                Continue Shopping
              </Button>
            </Box>
          ) : (
            <>
              {/* Cart Items */}
              <Box className="space-y-4">
                {cart.items.map((item) => {
                  const itemId = item.product?._id || item.product;
                  
                  return (
                    <Paper
                      key={itemId}
                      elevation={0}
                      className="p-4 border border-gray-200 rounded-lg relative"
                    >
                      {updatingItemId === itemId && (
                        <Box className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
                          <CircularProgress size={32} />
                        </Box>
                      )}

                      <Box className="flex items-center space-x-4">
                        <Box className="w-24 h-24 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </Box>

                        <Box className="flex-1">
                          <Typography variant="subtitle1" className="font-medium mb-1">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" className="mb-2">
                            ${item.price?.toFixed(2)}
                          </Typography>
                          
                          <Box className="flex items-center space-x-2">
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(itemId, item.quantity, -1)}
                              disabled={item.quantity <= 1 || updatingItemId === itemId}
                              className="hover:bg-gray-100"
                            >
                              <Minus className="h-4 w-4" />
                            </IconButton>
                            <Typography variant="body2" className="w-8 text-center">
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(itemId, item.quantity, 1)}
                              disabled={updatingItemId === itemId}
                              className="hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </IconButton>
                          </Box>

                          <Typography variant="subtitle2" className="mt-2 font-medium">
                            Subtotal: ${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>

                        <IconButton
                          onClick={() => handleRemoveItem(itemId)}
                          disabled={updatingItemId === itemId}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </IconButton>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              {/* Order Summary */}
              <Paper elevation={0} className="p-6 border border-gray-200 rounded-lg mt-6">
                <Typography variant="h6" className="mb-4 font-medium">
                  Order Summary
                </Typography>
                <Box className="space-y-3">
                  <Box className="flex justify-between">
                    <Typography variant="body2" color="textSecondary">
                      Subtotal ({cart.itemCount} items)
                    </Typography>
                    <Typography variant="body2">
                      ${cart.total?.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography variant="body2" color="textSecondary">
                      Shipping
                    </Typography>
                    <Typography variant="body2" className="text-green-600">
                      Free
                    </Typography>
                  </Box>
                  <Divider className="my-3" />
                  <Box className="flex justify-between">
                    <Typography variant="subtitle1" className="font-medium">
                      Total
                    </Typography>
                    <Typography variant="subtitle1" className="font-medium">
                      ${cart.total?.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/user/checkout')}
                  disabled={loading || updatingItemId}
                  className="mt-6"
                >
                  Proceed to Checkout
                </Button>
              </Paper>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default Cart;