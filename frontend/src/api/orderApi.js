import api from '@/utils/api';

export const useOrderApi = () => {
  const getAllOrders = async () => {
    try {
      const response = await api.get('/orders/admin/orders');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const getUserOrders = async (status = '') => {
    try {
      const response = await api.get(`/orders${status ? `?status=${status}` : ''}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const getOrderById = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, status, note) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status, note }); 
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const createOrder = async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return {
    getAllOrders,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    createOrder
  };
};

export default useOrderApi;