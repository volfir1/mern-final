// hooks/useCategories.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as categoryApi from '../api/categoryApi';

export const useCategories = (setSnackbar) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleAuthError = () => {
    localStorage.removeItem('token');
    navigate('/login');
    setSnackbar?.({
      open: true,
      message: 'Your session has expired. Please log in again',
      severity: 'warning'
    });
  };

  const handleError = (error, fallbackMessage) => {
    console.error(fallbackMessage, error);
    
    if (error?.response?.status === 401) {
      handleAuthError();
      return;
    }

    const errorMessage = error?.response?.status === 404 
      ? 'Item no longer exists or has already been deleted'
      : error?.response?.status === 403 
        ? 'You do not have permission to perform this action'
        : error?.message || fallbackMessage;

    setSnackbar?.({
      open: true,
      message: errorMessage,
      severity: 'error'
    });
    
    throw error;
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      return response.data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  };

  const { 
    data: categoriesData, 
    isLoading, 
    error,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.fetchCategories,
    select: (response) => {
      if (!response.data) return [];
      return response.data.data || [];
    },
    onError: (error) => handleError(error, 'Error loading categories')
  });

  const categories = categoriesData || [];

  const createMutation = (mutationFn, successMessage, errorMessage, includeImage = false) => 
    useMutation({
      mutationFn: async (params) => {
        if (includeImage && params.image) {
          try {
            const imageUrl = await uploadToCloudinary(params.image);
            const updatedData = { ...params.data, imageUrl };
            return mutationFn({ ...params, data: updatedData });
          } catch (error) {
            throw new Error('Failed to upload image: ' + error.message);
          }
        }
        return mutationFn(params);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        setSnackbar?.({
          open: true,
          message: successMessage,
          severity: 'success'
        });
      },
      onError: (error) => handleError(error, errorMessage)
    });

  const createCategoryMutation = createMutation(
    ({ data }) => categoryApi.createCategory(data),
    'Category created successfully',
    'Failed to create category',
    true
  );

  const updateCategoryMutation = createMutation(
    ({ id, data }) => categoryApi.updateCategory(id, data),
    'Category updated successfully',
    'Failed to update category',
    true
  );

  const deleteCategoryMutation = createMutation(
    categoryApi.deleteCategory,
    'Category deleted successfully',
    'Failed to delete category'
  );

  const createSubcategoryMutation = createMutation(
    ({ categoryId, data }) => categoryApi.createSubcategory(categoryId, data),
    'Subcategory created successfully',
    'Failed to create subcategory',
    true
  );

  const updateSubcategoryMutation = createMutation(
    ({ categoryId, subcategoryId, data }) => 
      categoryApi.updateSubcategory(categoryId, subcategoryId, data),
    'Subcategory updated successfully',
    'Failed to update subcategory',
    true
  );

  const deleteSubcategoryMutation = createMutation(
    ({ categoryId, subcategoryId }) => 
      categoryApi.deleteSubcategory(categoryId, subcategoryId),
    'Subcategory deleted successfully',
    'Failed to delete subcategory'
  );

  return {
    categories,
    isLoading,
    error,
    refetchCategories,
    createCategory: createCategoryMutation,
    updateCategory: updateCategoryMutation,
    deleteCategory: deleteCategoryMutation,
    createSubcategory: createSubcategoryMutation,
    updateSubcategory: updateSubcategoryMutation,
    deleteSubcategory: deleteSubcategoryMutation,
  };
};