// utils/productApi.js
import axiosInstance from './api';

// Helper function for handling response
const handleResponse = (response) => {
  if (response.status >= 400) {
    throw new Error(`Failed to fetch data: ${response.statusText}. ${response.data}`);
  }
  return response.data;
};

// Helper to check token with better error handling
const checkToken = () => {
  const token = localStorage.getItem('token');
  console.log('Current token:', token ? 'Present' : 'Missing');
  if (!token) {
    throw new Error('Authentication required. Please login.');
  }
  return token;
};

// Product API functions
export const productApi = {
  // Get all products
  getAllProducts: async () => {
    try {
      checkToken();
      const response = await axiosInstance.get('/products', {
        timeout: 10000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      console.log('Get products response:', response.status);
      return handleResponse(response);
    } catch (error) {
      console.error('Get products error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  },

  // Get single product
  getProduct: async (id) => {
    try {
      checkToken();
      if (!id) throw new Error('Product ID is required');
      
      const response = await axiosInstance.get(`/products/${id}`, {
        timeout: 10000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Get product error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  },

  // Create product
  createProduct: async (productData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await axiosInstance.post('/products', productData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    try {
      checkToken();
      if (!id) throw new Error('Product ID is required');
      
      const isFormData = productData instanceof FormData;
      console.log('Updating product:', id);
      
      const response = await axiosInstance.put(`/products/${id}`, productData, {
        timeout: 10000,
        headers: {
          ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
          'Cache-Control': 'no-cache'
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Update product error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      checkToken();
      if (!id) throw new Error('Product ID is required');
      
      console.log('Deleting product:', id);
      const response = await axiosInstance.delete(`/products/${id}`, {
        timeout: 10000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Delete product error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  },

  // Upload product image
  uploadProductImage: async (imageFile) => {
    try {
      checkToken();
      if (!imageFile) throw new Error('No file provided');

      const formData = new FormData();
      formData.append('image', imageFile);

      console.log('Uploading image');
      const response = await axiosInstance.post('/products/upload', formData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Cache-Control': 'no-cache'
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Upload image error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  }
};

export default productApi;