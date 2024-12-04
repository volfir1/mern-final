import api from '@/utils/api';
import { TokenManager } from '@/utils/tokenManager';

export const useOrderApi = () => {
  const getAllOrders = async () => {
    try {
      // Remove /api since it's already in VITE_API_URL
      const response = await api.get('/orders/admin/orders', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${await TokenManager.getToken()}`
        }
      });
  
      console.log('Orders API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
  
      return response.data;
    } catch (error) {
      console.error('getAllOrders error:', {
        baseUrl: import.meta.env.VITE_API_URL,
        endpoint: '/orders/admin/orders',
        error: error.message
      });
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


  const updateOrderStatus = async (orderId, status, note = '') => {
    try {
      // Input validation
      if (!orderId) throw new Error('Order ID is required');
      if (!status) throw new Error('Status is required');
      if (!['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
        throw new Error('Invalid status value');
      }
  
      // Debug logging
      console.log('Updating order status:', {
        orderId,
        orderStatus: status,
        note,
        timestamp: new Date().toISOString()
      });
  
      // Make request with correct payload structure
      const response = await api.patch(
        `/orders/${orderId}/status`,
        {
          orderStatus: status, // Changed from status to orderStatus
          note: note || ''
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await TokenManager.getToken()}`
          }
        }
      );
  
      // Success logging
      console.log('Status update successful:', {
        orderId,
        status: response.data.orderStatus,
        updatedAt: new Date().toISOString()
      });
  
      return response.data;
  
    } catch (error) {
      // Enhanced error logging
      console.error('Update failed:', {
        orderId,
        attemptedStatus: status,
        error: error.message,
        hasToken: !!await TokenManager.getToken(),
        timestamp: new Date().toISOString()
      });
      
      // Throw specific error messages
      if (error.response?.status === 404) {
        throw new Error('Order not found');
      }
      if (error.response?.status === 403) {
        throw new Error('Not authorized to update order status');
      }
      
      throw new Error(`Failed to update order status: ${error.message}`);
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

  const createReview = async (data) => {
    try {
      const response = await api.post('/orders/reviews', {
        productId: data.productId,
        rating: data.rating,
        comment: data.comment
      });
      return response.data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  };
  const cancelOrder = async (orderId) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        orderStatus: 'CANCELLED'
      });
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
    createOrder,
    createReview,
    cancelOrder
  };
};

export default useOrderApi;