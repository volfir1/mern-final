import axiosInstance from '../utils/api';

const API_ENDPOINTS = {
  base: '/suppliers'
};

export const fetchSuppliers = async (params = {}) => {
  try {
      const response = await axiosInstance.get(API_ENDPOINTS.base);
      console.log('Raw API Response:', response.data);

      const result = {
          data: response.data.suppliers || [],
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1,
          count: response.data.count || 0,
          success: response.data.success || false
      };

      console.log('Transformed result:', result);
      return result;
  } catch (error) {
      console.error('Fetch suppliers error:', error);
      throw error;
  }
};



export const testSupplierAPI = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.base);
    console.log('Direct API Test:', {
      fullResponse: response,
      data: response.data,
      nestedData: response.data?.data,
      suppliers: response.data?.data?.suppliers
    });
    return response.data;
  } catch (error) {
    console.error('API Test Error:', error);
    throw error;
  }
}

// Create supplier with better error handling
export const createSupplier = async (formData) => {
  try {
    console.log('Creating supplier with data:', formData);
    
    const response = await axiosInstance.post(API_ENDPOINTS.base, formData);
    
    console.log('Create supplier response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Create supplier error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.message || 'Failed to create supplier');
  }
};

export const getSupplierById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.base}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get supplier');
  }
};

export const updateSupplier = async (id, formData) => {
  try {
    const response = await axiosInstance.put(`${API_ENDPOINTS.base}/${id}`, formData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update supplier');
  }
};

export const deleteSupplier = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.base}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete supplier');
  }
};

export default {
  fetchSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  testSupplierAPI
};
