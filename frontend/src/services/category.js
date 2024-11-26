// api/categoryService.js
import axiosInstance from '../utils/api';

const API_ENDPOINTS = {
  categories: '/categories',
  subcategories: (categoryId) => `/categories/${categoryId}/subcategories`,
  category: (id) => `/categories/${id}`,
  subcategory: (categoryId, subcategoryId) => `/categories/${categoryId}/subcategory/${subcategoryId}`,
};

const handleResponse = (response) => {
  const { data, status } = response;
  if (status >= 400) {
    throw new Error(`Request failed: ${response.statusText}`);
  }
  return data?.data || data;
};

const handleError = (error, action) => {
  console.error(`Error during ${action}:`, error);
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  throw new Error(`Failed to ${action}: ${error.message}`);
};

// Category endpoints
export const fetchCategories = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.categories);
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'fetch categories');
  }
};

export const getCategoryById = async (id) => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.category(id));
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'fetch category');
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.categories, categoryData);
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'create category');
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const response = await axiosInstance.put(API_ENDPOINTS.category(id), categoryData);
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'update category');
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await axiosInstance.delete(API_ENDPOINTS.category(id));
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'delete category');
  }
};

// Subcategory endpoints
export const createSubcategory = async (categoryId, subcategoryData) => {
  try {
    const response = await axiosInstance.post(
      API_ENDPOINTS.subcategories(categoryId),
      subcategoryData
    );
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'create subcategory');
  }
};

export const updateSubcategory = async (categoryId, subcategoryId, subcategoryData) => {
  try {
    const response = await axiosInstance.put(
      API_ENDPOINTS.subcategory(categoryId, subcategoryId),
      subcategoryData
    );
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'update subcategory');
  }
};

export const deleteSubcategory = async (categoryId, subcategoryId) => {
  try {
    const response = await axiosInstance.delete(
      API_ENDPOINTS.subcategory(categoryId, subcategoryId)
    );
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'delete subcategory');
  }
};

export const getSubcategoriesByCategory = async (categoryId) => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.subcategories(categoryId));
    return handleResponse(response);
  } catch (error) {
    handleError(error, 'fetch subcategories');
  }
};