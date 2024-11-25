import axios from 'axios';
import api from '@/utils/api';
import { auth } from '../config/firebase.config';


const API_ENDPOINTS = {
  base: '/categories',
  subcategories: (categoryId) => `/categories/${categoryId}/subcategories`,
  subcategory: (categoryId, subcategoryId) => `/categories/${categoryId}/subcategories/${subcategoryId}`,
  category: (id) => `/categories/${id}`
};
// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  uploadUrl: `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};

// Helper function to get Firebase auth token
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

// Helper function to upload image to Cloudinary
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
    console.error('Cloudinary upload error:', {
      message: error.message,
      response: error.response?.data
    });
    throw new Error('Failed to upload image. Please try again.');
  }
};

// Helper function to prepare form data
const prepareFormData = (data, imageUrl = null) => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'image' && value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  
  if (imageUrl) {
    formData.append('imageUrl', imageUrl);
  }

  return formData;
};


// Category APIs
export const getCategories = async () => {
  try {
    const token = await getAuthToken();
    console.log('Fetching all categories with subcategories');
    
    const response = await api.get(`${API_ENDPOINTS.base}?populate=subcategories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Raw categories response:', response.data);

    // Transform response data
    let categories = response.data.data;
    if (Array.isArray(categories)) {
      categories = categories.map(category => ({
        _id: category._id,
        name: category.name,
        description: category.description,
        image: category.image || {
          url: category.imageUrl,
          publicId: category.imagePublicId
        },
        slug: category.slug,
        isActive: category.isActive,
        orderIndex: category.orderIndex,
        metadata: category.metadata || {},
        subcategories: (category.subcategories || []).map(sub => ({
          _id: sub._id,
          name: sub.name,
          description: sub.description,
          image: sub.image || {
            url: sub.imageUrl,
            publicId: sub.imagePublicId
          },
          slug: sub.slug,
          isActive: sub.isActive,
          orderIndex: sub.orderIndex,
          category: sub.category,
          metadata: sub.metadata || {},
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt
        }))
      }));
    }

    console.log('Transformed categories:', categories);

    return {
      ...response,
      data: {
        success: true,
        data: categories
      }
    };
  } catch (error) {
    console.error('Get categories error:', {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};  

export const getCategoryDetails = async (categoryId) => {
  try {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    const token = await getAuthToken();
    console.log('Fetching category details:', categoryId);
    
    const response = await api.get(`${API_ENDPOINTS.category(categoryId)}?populate=subcategories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const category = response.data.data;
    const transformedCategory = {
      _id: category._id,
      name: category.name,
      description: category.description,
      image: category.image || {
        url: category.imageUrl,
        publicId: category.imagePublicId
      },
      slug: category.slug,
      isActive: category.isActive,
      orderIndex: category.orderIndex,
      metadata: category.metadata || {},
      subcategories: (category.subcategories || []).map(sub => ({
        _id: sub._id,
        name: sub.name,
        description: sub.description,
        image: sub.image || {
          url: sub.imageUrl,
          publicId: sub.imagePublicId
        },
        slug: sub.slug,
        isActive: sub.isActive,
        orderIndex: sub.orderIndex,
        category: sub.category,
        metadata: sub.metadata || {},
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      }))
    };

    return {
      ...response,
      data: {
        success: true,
        data: transformedCategory
      }
    };
  } catch (error) {
    console.error('Get category details error:', {
      categoryId,
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

export const createCategory = async (data) => {
  try {
    if (!data.name) {
      throw new Error('Category name is required');
    }

    const token = await getAuthToken();
    console.log('Creating new category:', data.name);

    // Handle image upload if present
    let imageUrl = null;
    if (data.image) {
      imageUrl = await uploadToCloudinary(data.image);
    }

    const categoryData = {
      name: data.name,
      description: data.description,
      imageUrl: imageUrl
    };

    const response = await api.post(API_ENDPOINTS.base, categoryData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Category created successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Create category error:', {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

export const updateCategory = async (id, data) => {
  try {
    if (!id) {
      throw new Error('Category ID is required');
    }

    const token = await getAuthToken();
    console.log('Updating category:', id);

    const imageUrl = data.image ? await uploadToCloudinary(data.image) : null;
    const formData = prepareFormData(data, imageUrl);

    const response = await api.put(API_ENDPOINTS.category(id), formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Category updated successfully');
    return response;
  } catch (error) {
    console.error('Update category error:', {
      id,
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    if (!id) {
      throw new Error('Category ID is required');
    }

    const token = await getAuthToken();
    console.log('Deleting category:', id);

    const response = await api.delete(API_ENDPOINTS.category(id), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Category deleted successfully');
    return response;
  } catch (error) {
    console.error('Delete category error:', {
      id,
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

// Subcategory APIs
export const getSubcategoriesByCategory = async (categoryId) => {
  try {
    if (!categoryId) {
      console.log('No category ID provided for subcategories');
      return { data: { data: [] } };
    }

    const token = await getAuthToken();
    console.log('Fetching subcategories for category:', categoryId);
    
    const response = await api.get(API_ENDPOINTS.subcategories(categoryId), {
      headers: { 'Authorization': `Bearer ${token}` },
      params: {
        isActive: true,
        sort: 'orderIndex'
      }
    });

    const subcategories = response.data.data || [];
    const transformedSubcategories = subcategories.map(sub => ({
      _id: sub._id,
      name: sub.name,
      description: sub.description,
      image: sub.image || {
        url: sub.imageUrl,
        publicId: sub.imagePublicId
      },
      slug: sub.slug,
      isActive: sub.isActive,
      orderIndex: sub.orderIndex,
      category: sub.category,
      metadata: sub.metadata || {},
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }));

    console.log('Transformed subcategories:', transformedSubcategories);

    return {
      ...response,
      data: {
        success: true,
        data: transformedSubcategories
      }
    };
  } catch (error) {
    console.error('Get subcategories error:', {
      categoryId,
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};



export const createSubcategory = async ({ categoryId, data }) => {
  try {
    if (!categoryId || !data.name) {
      throw new Error('Category ID and subcategory name are required');
    }

    const token = await getAuthToken();
    console.log('Creating subcategory:', { categoryId, name: data.name });

    // Handle image first if it exists
    let imageUrl = null;
    if (data.image) {
      try {
        const uploadResult = await uploadToCloudinary(data.image);
        console.log('Image uploaded:', uploadResult);
        imageUrl = uploadResult;
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        throw new Error('Failed to upload image');
      }
    }

    // Prepare the subcategory data
    const subcategoryData = {
      name: data.name,
      description: data.description,
      category: categoryId,
      image: imageUrl ? {
        url: imageUrl,
        publicId: imageUrl.split('/').pop().split('.')[0] // Extract public ID from URL
      } : undefined,
      isActive: data.isActive !== false, // Default to true if not specified
      orderIndex: data.orderIndex || 0
    };

    console.log('Sending subcategory data:', subcategoryData);

    const response = await api.post(
      API_ENDPOINTS.subcategories(categoryId),
      subcategoryData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Subcategory created successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Create subcategory error:', {
      categoryId,
      name: data?.name,
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

export const updateSubcategory = async (categoryId, subcategoryId, data) => {
  try {
    if (!categoryId) throw new Error('Category ID is required');
    if (!subcategoryId) throw new Error('Subcategory ID is required');

    const token = await getAuthToken();
    console.log('Updating subcategory:', { categoryId, subcategoryId, data });

    // Handle image upload if new image is provided
    let imageUrl = null;
    if (data.image instanceof File) {
      try {
        imageUrl = await uploadToCloudinary(data.image);
        console.log('New image uploaded:', imageUrl);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        throw new Error('Failed to upload image');
      }
    }

    // Prepare update data
    const updateData = {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      orderIndex: data.orderIndex,
      ...(imageUrl && {
        image: {
          url: imageUrl,
          publicId: imageUrl.split('/').pop().split('.')[0]
        }
      })
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    console.log('Sending update data:', updateData);

    const response = await api.put(
      API_ENDPOINTS.subcategory(categoryId, subcategoryId),
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Subcategory updated successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Update subcategory error:', {
      categoryId,
      subcategoryId,
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
};


export const deleteSubcategory = async (categoryId, subcategoryId) => {
  try {
    if (!categoryId) throw new Error('Category ID is required');
    if (!subcategoryId) throw new Error('Subcategory ID is required');

    const token = await getAuthToken();
    console.log('Deleting subcategory:', { categoryId, subcategoryId });

    const response = await api.delete(
      API_ENDPOINTS.subcategory(categoryId, subcategoryId),
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    console.log('Subcategory deleted successfully');
    return response;
  } catch (error) {
    console.error('Delete subcategory error:', {
      categoryId,
      subcategoryId,
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
};


// Export both ways for backward compatibility
export const categoryApi = {
  getCategories,
  getCategoryDetails,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategoriesByCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
};

// Default export
export default categoryApi;