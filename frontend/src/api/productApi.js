// src/api/productApi.js
import axios from 'axios';
import api from '@/utils/api';
import { auth } from '../config/firebase.config';

const API_ENDPOINTS = {
  base: '/products',
  product: (id) => `/products/${id}`,
  checkName: '/products/check-name',
  images: '/upload',
   search: '/products/search'
};

// Cloudinary configuration (reuse from category)
const CLOUDINARY_CONFIG = {
  uploadUrl: `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};

// Helper function to get Firebase auth token (reuse from category)
const getAuthToken = async () => {
  try {
    const token = await auth.currentUser?.getIdToken(true);
    if (!token) {
      throw new Error('No authentication token available');
    }
    console.log('Auth token refreshed');
    return token;
  } catch (error) {
    console.error('Get auth token error:', error);
    throw new Error('Authentication failed. Please login again.');
  }
};

// Helper function to upload image to Cloudinary (reuse from category)
const uploadToCloudinary = async (file) => {
  try {
    if (!file) return null;
    
    console.log('Uploading image to Cloudinary');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    const response = await axios.post(CLOUDINARY_CONFIG.uploadUrl, formData);
    
    console.log('Cloudinary upload successful');
    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// Product APIs
export const getAllProducts = async (page = 1, limit = 10) => {
  try {
    const token = await getAuthToken();
    console.log('Requesting products:', { page, limit });
    
    const response = await api.get(API_ENDPOINTS.base, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit }
    });

    console.log('Raw API response:', response);
    
    // Return the response directly without transformation
    return response;
  } catch (error) {
    console.error('ProductApi error:', error);
    throw error;
  }
};

export const getProduct = async (id) => {
  try {
    if (!id) throw new Error('Product ID is required');
    
    const token = await getAuthToken();
    console.log('Fetching product:', id);
    
    const response = await api.get(API_ENDPOINTS.product(id), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Product retrieved successfully');
    return response;
  } catch (error) {
    console.error('Get product error:', error);
    throw error;
  }
};

export const createProduct = async (data) => {
  try {
    const token = await getAuthToken();
    console.log('Creating new product:', data.name);

    // Handle multiple image uploads
    let imageUrls = [];
    if (data.images?.length) {
      const uploadPromises = Array.from(data.images).map(uploadToCloudinary);
      imageUrls = await Promise.all(uploadPromises);
    }

    const formData = new FormData();
    
    // Append basic fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'images' && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    // Append image URLs
    imageUrls.forEach(url => formData.append('imageUrls[]', url));

    const response = await api.post(API_ENDPOINTS.base, formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Product created successfully');
    return response;
  } catch (error) {
    console.error('Create product error:', error);
    throw error;
  }
};

export const updateProduct = async (id, data) => {
  try {
    if (!id) throw new Error('Product ID is required');
    
    const token = await getAuthToken();
    console.log('Updating product:', id);

    // Handle new image uploads
    let newImageUrls = [];
    if (data.newImages?.length) {
      const uploadPromises = Array.from(data.newImages).map(uploadToCloudinary);
      newImageUrls = await Promise.all(uploadPromises);
    }

    const formData = new FormData();
    
    // Append updated fields
    Object.entries(data).forEach(([key, value]) => {
      if (!['newImages', 'images'].includes(key) && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    // Append existing and new image URLs
    if (data.existingImages?.length) {
      formData.append('existingImages', JSON.stringify(data.existingImages));
    }
    newImageUrls.forEach(url => formData.append('newImageUrls[]', url));

    const response = await api.put(API_ENDPOINTS.product(id), formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Product updated successfully');
    return response;
  } catch (error) {
    console.error('Update product error:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    if (!id) throw new Error('Product ID is required');
    
    const token = await getAuthToken();
    console.log('Deleting product:', id);

    const response = await api.delete(API_ENDPOINTS.product(id), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Product deleted successfully');
    return response;
  } catch (error) {
    console.error('Delete product error:', error);
    throw error;
  }
};

export const checkProductName = async (name, productId = null) => {
  try {
    const token = await getAuthToken();
    
    const params = new URLSearchParams({ name });
    if (productId) params.append('productId', productId);

    const response = await api.get(
      `${API_ENDPOINTS.checkName}?${params.toString()}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    return response;
  } catch (error) {
    console.error('Check product name error:', error);
    throw error;
  }
};


export const searchProducts = async (query) => {
  try {
    console.log('Searching products:', query);
    
    const response = await api.get(API_ENDPOINTS.search, {
      params: { query }
    });

    if (response.data?.success) {
      return {
        success: true,
        data: response.data.data || []
      };
    }
    throw new Error(response.data?.message || 'Search failed');
  } catch (error) {
    console.error('Search products error:', error);
    throw error;
  }
};
// Export both ways for consistency
export const productApi = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  checkProductName,
  searchProducts
};

export default productApi;