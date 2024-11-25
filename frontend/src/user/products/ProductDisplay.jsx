import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productApi } from '@/api/productApi';
import { cartApi } from '@/api/cartApi';
import ProductGrid from './ProductGrid';
import Navbar from '@/components/navbar/Navbar';

const ProductDisplay = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Set up intersection observer with optimized settings
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1, // Trigger when just 10% of the element is visible
    rootMargin: '10px', // Start loading 100px before the element comes into view
    triggerOnce: false,
  });

  const fetchProducts = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching products for page:', pageNum);
      
      // Fetch 10 products per page
      const response = await productApi.getAllProducts(pageNum, 10);
      console.log('API Response:', response);

      if (response?.data?.success) {
        const newProducts = response.data.data || [];
        
        // Append new products to existing ones
        setProducts(prev => {
          // If it's the first page, replace all products
          if (pageNum === 1) return newProducts;
          
          // For subsequent pages, append new products
          // Remove any duplicates by ID
          const existingIds = new Set(prev.map(p => p._id));
          const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p._id));
          return [...prev, ...uniqueNewProducts];
        });
        
        // Check if we've reached the end
        // We'll consider we have more if we received a full page of products
        setHasMore(newProducts.length === 10);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products. Please try again later.');
      if (pageNum === 1) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  }, [inView, loading, hasMore, page, fetchProducts]);

  // Add to cart handler
  const handleAddToCart = async (product, quantity) => {
    try {
      console.log('Adding to cart:', { product, quantity });
  
      if (!product?._id) {
        throw new Error('Invalid product ID');
      }
  
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
  };

  // Handle retry on error
  const handleRetry = () => {
    setPage(1);
    fetchProducts(1);
  };

  if (error && products.length === 0) {
    return (
      <Container>
        <Alert 
          severity="error" 
          sx={{ mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Products
            </Typography>
          </Box>

          <ProductGrid 
            products={products}
            onAddToCart={handleAddToCart}
          />
          
          {/* Loading indicator at bottom */}
          <Box 
            ref={loadMoreRef} 
            display="flex" 
            justifyContent="center" 
            py={4}
          >
            {loading && <CircularProgress size={40} />}
          </Box>

          {!loading && products.length === 0 && (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              minHeight="60vh"
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          )}

          {!hasMore && products.length > 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                You've reached the end
              </Typography>
            </Box>
          )}
        </Container>
      </div>
    </div>
  );
};

export default ProductDisplay;