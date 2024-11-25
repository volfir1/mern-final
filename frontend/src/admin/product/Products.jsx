import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  TextField,
  Alert,
  Typography,
  TablePagination,
} from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import api from "@/utils/api";

import Sidebar from "../../components/sidebar/Sidebar";
import ProductTable from "./ProductTable";
import ProductFormDialog from "./ProductForm";
import ProductDetailsDialog from "./ProductDetails";
import DeleteConfirmDialog from "./DeleteConfirm";
import LoadingFallBack from "../../components/ui/loader";
import { TokenManager } from "../../utils/tokenManager";

const Products = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Fetch products
  const fetchProducts = async () => {
    try {
      console.log('🟦 Starting fetch products');
      setLoading(true);
      setError(null);
      
      console.log('🟦 Making API request to:', '/products');
      const response = await api.get('/products');
      console.log('🟦 API Response:', response);
  
      if (response.data.success) {
        console.log('🟩 Products loaded:', response.data.data?.length);
        setProducts(response.data.data || []);
      } else {
        console.log('🟥 Error from API:', response.data.message);
        toast.error('Failed to fetch products');
        setError('Failed to fetch products');
      }
    } catch (error) {
      console.log('🟥 Fetch error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        window.location.href = '/login';
      } else {
        const errorMessage = error.response?.data?.message || 'Error loading products';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } finally {
      console.log('🟦 Fetch completed');
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handlers
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDelete = async () => {
    if (!selectedProduct?._id) return;
    
    try {
      setDeleteLoading(true);
      const response = await api.delete(`/products/${selectedProduct._id}`); // Remove the /api prefix since it's in baseURL
  
      if (response.data.success) {
        toast.success(`${selectedProduct.name} was successfully deleted`);
        await fetchProducts();
        setDeleteDialogOpen(false);
        setSelectedProduct(null);
      } else {
        throw new Error(response.data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', {
        productId: selectedProduct._id,
        error: error.message,
        response: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Error deleting product';
      
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    await fetchProducts();
    handleCloseDialog();
    toast.success("Product saved successfully");
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Filter and pagination
  const filteredProducts = products.filter(
    (product) =>
      product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      {/* Main content */}
      <div className="flex-1 ml-20 transition-all duration-300 overflow-hidden">
        <div className="h-full p-8">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your product inventory and details
                </p>
              </div>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200 transform hover:scale-105"
              >
                Add Product
              </Button>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-72">
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
                    className: "bg-gray-50 rounded-lg",
                  }}
                  fullWidth
                />
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Total Products: {filteredProducts.length}</span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              className="mb-6 rounded-lg shadow-sm"
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Main Content Area */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <LoadingFallBack />
              </div>
            ) : (
              <>
                {!loading && products.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <img
                        src="../../images/brands/images.png"
                        alt="No products"
                        className="mx-auto h-16 w-16 text-gray-400"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No products found
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Get started by adding your first product
                    </p>
                    <Button
                      variant="outlined"
                      onClick={() => setOpenDialog(true)}
                      className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                    >
                      Add Product
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto h-[calc(100vh-300px)] overflow-y-auto">
                    <ProductTable
                      products={paginatedProducts}
                      formatPrice={formatPrice}
                      onEdit={(product) => {
                        setSelectedProduct(product);
                        setOpenDialog(true);
                      }}
                      onDelete={(product) => {
                        setSelectedProduct(product);
                        setDeleteDialogOpen(true);
                      }}
                      onViewDetails={(product) => {
                        setSelectedProduct(product);
                        setOpenDetailsDialog(true);
                      }}
                    />

                    {products.length > 0 && (
                      <div className="border-t border-gray-200 px-6 py-4">
                        <TablePagination
                          component="div"
                          count={filteredProducts.length}
                          page={page}
                          onPageChange={(e, newPage) => setPage(newPage)}
                          rowsPerPage={rowsPerPage}
                          onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                          }}
                          rowsPerPageOptions={[5, 10, 25, 50]}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <ProductFormDialog
          open={openDialog}
          handleClose={handleCloseDialog}
          product={selectedProduct}
          onSave={handleSaveProduct}
        />

        <ProductDetailsDialog
          open={openDetailsDialog}
          handleClose={() => {
            setOpenDetailsDialog(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          formatPrice={formatPrice}
        />

<DeleteConfirmDialog
  open={deleteDialogOpen}
  handleClose={() => {
    if (!deleteLoading) {
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  }}
  handleConfirm={handleDelete}
  productName={selectedProduct?.name}
  isLoading={deleteLoading}
/>
      </div>
    </div>
  );
};

export default Products;