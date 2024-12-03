import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TablePagination,
} from '@mui/material';
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
  const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);
const [totalProducts, setTotalProducts] = useState(0);
const [currentPage, setCurrentPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState(0);

  const fetchProducts = useCallback(async (pageNum, limit) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getAllProducts(pageNum + 1, limit);
  
      if (response?.data?.success) {
        const { data, pagination } = response.data;
        setProducts(data);
        setTotalProducts(pagination.totalProducts);
        setTotalPages(pagination.totalPages);
        setCurrentPage(pageNum); // Keep 0-based for MUI pagination
        setPage(pageNum);
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  

  useEffect(() => {
    fetchProducts(page, rowsPerPage);
  }, [fetchProducts, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchProducts(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page
    fetchProducts(0, newRowsPerPage);
  };

  const handleRetry = () => {
    setPage(0);
    fetchProducts(0, rowsPerPage);
  };

  const handleAddToCart = async (product, quantity) => {
    try {
      if (!product?._id) {
        throw new Error('Invalid product ID');
      }

      const response = await cartApi.addToCart(product._id, quantity);

      if (response.success) {
        toast.success(`Added ${quantity} ${product.name} to cart`);
        window.dispatchEvent(new CustomEvent('cart-updated')); // You can trigger any event here for cart update
      } else {
        throw new Error(response.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(error.message || 'Failed to add item to cart');
      throw error;
    }
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
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <Typography variant="h4" component="h1">
    Products {!loading && totalProducts > 0 && `(${totalProducts})`}
  </Typography>
</Box>

          <ProductGrid 
            products={products}
            onAddToCart={handleAddToCart} // Pass the function as a prop
          />

          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={40} />
            </Box>
          )}

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

{products.length > 0 && (
  <Box sx={{ py: 2, display: 'flex', justifyContent: 'flex-end' }}>
    <TablePagination
      component="div"
      count={totalProducts} // Total number of products
      page={page} // Current page (0-based)
      onPageChange={handleChangePage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      rowsPerPageOptions={[5, 10, 25, 50]}
      labelRowsPerPage="Products per page:"
      labelDisplayedRows={({ from, to, count }) => 
        `${from}-${to} of ${count}`}
    />
  </Box>
)}
        </Container>
      </div>
    </div>
  );
};

export default ProductDisplay;
