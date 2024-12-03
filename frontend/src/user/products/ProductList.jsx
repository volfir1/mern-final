import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Pagination, 
  CircularProgress, Alert, Button, Stack
} from '@mui/material';
import { toast } from 'react-toastify';
import ProductGrid from './ProductGrid';
import { productApi } from '@/api/productApi';
import { cartApi } from '@/api/cartApi';

const ITEMS_PER_PAGE = 10;

const ProductListContainer = () => {
  const [state, setState] = useState({
    products: [],
    loading: true,
    error: null,
    page: 1,
    totalPages: 1,
    totalProducts: 0
  });

  const fetchProducts = useCallback(async (page) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await productApi.getAllProducts(page, ITEMS_PER_PAGE);
      
      if (response?.data?.success) {
        const { data, pagination } = response.data;
        setState(prev => ({
          ...prev,
          products: data,
          totalPages: pagination.totalPages,
          totalProducts: pagination.totalProducts,
          loading: false
        }));
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setState(prev => ({
        ...prev,
        error: err.message,
        loading: false
      }));
      toast.error('Failed to load products');
    }
  }, []);
  

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (_, newPage) => {
    setState(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProducts(newPage);
  };

  const handleAddToCart = async (product, quantity) => {
    try {
      if (!product?._id) throw new Error('Invalid product ID');
      
      const response = await cartApi.addToCart(product._id, quantity);
      
      if (response.success) {
        toast.success(`Added ${quantity} ${product.name} to cart`);
        window.dispatchEvent(new CustomEvent('cart-updated'));
      } else {
        throw new Error(response.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(error.message || 'Failed to add item to cart');
    }
  };

  if (state.error) {
    return (
      <Container>
        <Alert 
          severity="error" 
          sx={{ mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchProducts}>
              Retry
            </Button>
          }
        >
          {state.error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Our Products {!state.loading && state.totalProducts > 0 && 
            `(${state.totalProducts})`}
        </Typography>

        {state.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={4}>
            <ProductGrid 
              products={state.products} 
              onAddToCart={handleAddToCart} 
            />

            {state.totalPages > 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Page {state.page} of {state.totalPages}
                </Typography>
                <Pagination
                  count={state.totalPages}
                  page={state.page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  disabled={state.loading}
                  siblingCount={1}
                  boundaryCount={1}
                />
              </Box>
            )}

            {state.products.length === 0 && !state.loading && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No products found
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Container>
  );
};

export default ProductListContainer;