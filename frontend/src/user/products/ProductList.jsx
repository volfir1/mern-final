import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Pagination, 
  CircularProgress, Alert, Button
} from '@mui/material';
import { toast } from 'react-toastify';
import ProductGrid from './ProductGrid';
import { productApi } from '@/api/productApi';
import { cartApi } from '@/api/cartApi';

const ITEMS_PER_PAGE = 12;

const ProductListContainer = () => {
  const [state, setState] = useState({
    products: [],
    loading: true,
    error: null,
    page: 1,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalProducts: 0
    }
  });
  const handleEdit = async (productId) => {
    // Navigate to edit page or open modal
    navigate(`/products/edit/${productId}`);
  };
  
  const handleDelete = async (productId) => {
    try {
      await productApi.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts(); // Refresh list
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const handleCreate = () => {
    navigate('/products/create');
  };
  const fetchProducts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await productApi.getAllProducts(state.page);
      
      if (response?.data?.success) {
        setState(prev => ({
          ...prev,
          products: response.data.data || [],
          pagination: {
            currentPage: response.data.currentPage || 1,
            totalPages: response.data.totalPages || 1,
            totalProducts: response.data.totalProducts || 0
          }
        }));
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to load products',
        products: []
      }));
      toast.error('Failed to load products');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.page]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchProducts]);

  const handlePageChange = useCallback((_, newPage) => {
    setState(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddToCart = useCallback(async (product, quantity) => {
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
      throw error;
    }
  }, []);

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

  const { loading, products, pagination } = state;

  return (
    <Container maxWidth="xl" className="py-4">
      <Box className="mb-4">
        <Typography variant="h4" component="h1" gutterBottom>
          Our Products {!loading && `(${pagination.totalProducts})`}
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          Discover our collection of amazing products
        </Typography>
      </Box>

      {loading ? (
        <Box className="flex justify-center items-center min-h-[60vh]">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
          />

          {pagination.totalPages > 1 && (
            <Box className="flex justify-center mt-4">
              <Pagination
                count={pagination.totalPages}
                page={pagination.currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {products.length === 0 && !loading && (
            <Box className="text-center py-8">
              <Typography variant="h6" className="text-gray-600">
                No products found
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductListContainer;