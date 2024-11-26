import axiosInstance from '../utils/api';

const API_ENDPOINTS = {
  // Base endpoints
  categories: '/categories',
  subcategories: '/subcategories',
  // Individual resource endpoints
  category: (id) => `/categories/${id}`,
  subcategory: (id) => `/subcategories/${id}`,
};

// Category endpoints
export const fetchCategories = () => 
  axiosInstance.get(API_ENDPOINTS.categories);

export const getCategoryById = (id) => 
  axiosInstance.get(API_ENDPOINTS.category(id));

export const createCategory = (categoryData) => 
  axiosInstance.post(API_ENDPOINTS.categories, categoryData);

export const updateCategory = (id, categoryData) => 
  axiosInstance.put(API_ENDPOINTS.category(id), categoryData);

export const deleteCategory = (id) => 
  axiosInstance.delete(API_ENDPOINTS.category(id));

// Subcategory endpoints
export const fetchSubcategories = () => 
  axiosInstance.get(API_ENDPOINTS.subcategories);

export const getSubcategoryById = (id) => 
  axiosInstance.get(API_ENDPOINTS.subcategory(id));

export const createSubcategory = (subcategoryData) => 
  axiosInstance.post(API_ENDPOINTS.subcategories, subcategoryData);

export const updateSubcategory = (id, subcategoryData) => 
  axiosInstance.put(API_ENDPOINTS.subcategory(id), subcategoryData);

export const deleteSubcategory = (id) => 
  axiosInstance.delete(API_ENDPOINTS.subcategory(id));  