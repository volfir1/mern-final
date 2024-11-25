// src/hooks/category.js
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { categoryApi } from '../api/categoryApi';
import { useAuth } from '../utils/authContext';
import { TokenManager } from '../utils/tokenManager';
import { auth } from '../config/firebase.config'; 
import { useMemo } from 'react';


const transformCategoryData = (category) => {
  return {
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
};

const useCategory = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogState, setDialogState] = useState({
    create: false,
    edit: false,
    delete: false,
    createSub: false,
  });
  const [editType, setEditType] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !isAuthenticated) {
          console.log('No authenticated user, redirecting to login');
          navigate('/login');
          return;
        }
        
        try {
          await currentUser.getIdToken(true);
        } catch (error) {
          console.error('Token refresh failed:', error);
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [isAuthenticated, navigate]);

  // Error Handler
  const handleError = (error, fallbackMessage) => {
    console.log('Error occurred:', error);
    if (error?.response?.status === 401) {
      console.log('401 error detected, clearing auth');
      TokenManager.clearAuth();
      navigate('/login');
      return;
    }

    setSnackbar({
      open: true,
      message: error?.message || fallbackMessage,
      severity: 'error'
    });
  };

  // Queries
  const { 
    data: categoriesData, 
    isLoading, 
    error,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        console.log('Fetching categories with subcategories...');
        const response = await categoryApi.getCategories();
        console.log('Raw categories response:', response.data);

        // Transform the data
        const transformedCategories = (response.data?.data || [])
          .map(transformCategoryData)
          .map(cat => ({
            ...cat,
            subcategories: cat.subcategories?.filter(sub => sub.isActive) || []
          }));

        console.log('Transformed categories:', transformedCategories);

        return {
          ...response,
          data: {
            ...response.data,
            data: transformedCategories
          }
        };
      } catch (error) {
        console.error('Categories fetch error:', error);
        if (error?.response?.status === 401) {
          navigate('/login');
        }
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  const categories = categoriesData?.data?.data || [];
  const filteredCategories = useMemo(() => 
    categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  , [categories, searchTerm]);

  // Helper function to get subcategories for a category
  const getCategorySubcategories = useCallback((categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category?.subcategories || [];
  }, [categories]);

  // Mutations
  const createCategory = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeAllDialogs();
      setSnackbar({
        open: true,
        message: 'Category created successfully',
        severity: 'success'
      });
    },
    onError: (error) => handleError(error, 'Failed to create category')
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }) => categoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeAllDialogs();
      setSnackbar({
        open: true,
        message: 'Category updated successfully',
        severity: 'success'
      });
    },
    onError: (error) => handleError(error, 'Failed to update category')
  });

  const deleteCategory = useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeAllDialogs();
      setSnackbar({
        open: true,
        message: 'Category deleted successfully',
        severity: 'success'
      });
    },
    onError: (error) => handleError(error, 'Failed to delete category')
  });

  const createSubcategory = useMutation({
    mutationFn: async ({ categoryId, data }) => {
      console.log('Creating subcategory:', { categoryId, data });
      if (!categoryId || !data) {
        throw new Error('Missing required data for subcategory creation');
      }
      return categoryApi.createSubcategory({ 
        categoryId, 
        data: {
          name: data.name,
          description: data.description,
          image: data.image,
          isActive: data.isActive !== false
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeAllDialogs();
      setSnackbar({
        open: true,
        message: 'Subcategory created successfully',
        severity: 'success'
      });
    },
    onError: (error) => handleError(error, 'Failed to create subcategory')
  });


  const updateSubcategory = useMutation({
    mutationFn: ({ categoryId, subcategoryId, data }) => {
      console.log('Updating subcategory:', { categoryId, subcategoryId, data });
      if (!categoryId || !subcategoryId) {
        throw new Error('Category ID and subcategory ID are required');
      }
      return categoryApi.updateSubcategory(categoryId, subcategoryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeAllDialogs();
      setSnackbar({
        open: true,
        message: 'Subcategory updated successfully',
        severity: 'success'
      });
    },
    onError: (error) => handleError(error, 'Failed to update subcategory')
  });

  const deleteSubcategory = useMutation({
    mutationFn: ({ categoryId, subcategoryId }) => {
      console.log('Deleting subcategory:', { categoryId, subcategoryId });
      if (!categoryId || !subcategoryId) {
        throw new Error('Category ID and subcategory ID are required');
      }
      return categoryApi.deleteSubcategory(categoryId, subcategoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeAllDialogs();
      setSnackbar({
        open: true,
        message: 'Subcategory deleted successfully',
        severity: 'success'
      });
    },
    onError: (error) => handleError(error, 'Failed to delete subcategory')
  });

  const handleSubcategoryOperation = useCallback((operation, categoryId, subcategoryId = null, data = null) => {
    if (!categoryId) {
      setSnackbar({
        open: true,
        message: 'Category ID is required',
        severity: 'error'
      });
      return;
    }

    switch (operation) {
      case 'create':
        createSubcategory.mutate({ categoryId, data });
        break;
      case 'update':
        if (!subcategoryId) {
          setSnackbar({
            open: true,
            message: 'Subcategory ID is required',
            severity: 'error'
          });
          return;
        }
        updateSubcategory.mutate({ categoryId, subcategoryId, data });
        break;
      case 'delete':
        if (!subcategoryId) {
          setSnackbar({
            open: true,
            message: 'Subcategory ID is required',
            severity: 'error'
          });
          return;
        }
        deleteSubcategory.mutate({ categoryId, subcategoryId });
        break;
      default:
        console.error('Unknown operation:', operation);
    }
  }, [createSubcategory, updateSubcategory, deleteSubcategory]);

  // Utility functions
  const closeAllDialogs = useCallback(() => {
    setDialogState({
      create: false,
      createSub: false,
      edit: false,
      delete: false
    });
    setSelectedItem(null);
    setEditType(null);
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleEdit = useCallback((item, type) => {
    const transformedItem = transformCategoryData(item);
    setSelectedItem(transformedItem);
    setEditType(type || (item.parentId ? 'subcategory' : 'category'));
    setDialogState(prev => ({ ...prev, edit: true }));
  }, []);


  const handleDelete = useCallback((item, parentCategoryId = null) => {
    const transformedItem = transformCategoryData(item);
    setSelectedItem({
      ...transformedItem,
      parentId: parentCategoryId,
    });
    setEditType(parentCategoryId ? 'subcategory' : 'category');
    setDialogState(prev => ({ ...prev, delete: true }));
  }, []);

  const closeSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  return {
    // Data
    categories: filteredCategories,
    selectedItem,
    dialogState,
    editType,
    searchTerm,
    snackbar,
    isLoading,
    error,

    // Actions
    handleSearch,
    handleEdit,
    handleDelete,
    closeAllDialogs,
    closeSnackbar,
    setDialogState,
    refetchCategories,
    getCategorySubcategories, 

    
    // Mutations
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    handleSubcategoryOperation
  };
};

export default useCategory;