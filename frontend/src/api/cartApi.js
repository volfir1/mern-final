// src/utils/cartApi.js
import api from '@/utils/api';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/config/firebase.config';

// API endpoints
const API_CART_URL = '/cart';
const API_CHECKOUT_URL = '/checkout';
const API_PAYMENTS_URL = '/payments';
const FRONTEND_CHECKOUT_URL = '/user/checkout';

const auth = getAuth(firebaseApp);

const ensureToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No user found');
      window.location.href = `/login?redirect=${FRONTEND_CHECKOUT_URL}`;
      throw new Error('User not authenticated');
    }
    
    console.log('Getting token for user:', currentUser.uid);
    const token = await currentUser.getIdToken(true);
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};

export const cartApi = {
  // Existing cart operations...
  getCart: async () => {
    try {
      await ensureToken();
      const response = await api.get(API_CART_URL);
      console.log('Got cart:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = `/login?redirect=${FRONTEND_CHECKOUT_URL}`;
      }
      console.error('Get cart error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // Checkout operations

  initiateCheckout: async (data) => {
    try {
      await ensureToken();
      const response = await api.post(API_CHECKOUT_URL, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Checkout failed');
      }
      
      if (!response.data.data?._id) {
        throw new Error('No order ID received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Checkout initiation error:', error);
      if (error.response?.status === 401) {
        window.location.href = `/login?redirect=${FRONTEND_CHECKOUT_URL}`;
      }
      throw error.response?.data || error;
    }
  },

  getCheckoutStatus: async (orderId) => {
    try {
      await ensureToken();
      const response = await api.get(`${API_CHECKOUT_URL}/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error('Get checkout status error:', error);
      throw error.response?.data || error;
    }
  },

  confirmCheckout: async (orderId) => {
    try {
      if (!orderId) {
        throw new Error('Order ID is required for confirmation');
      }
      
      await ensureToken();
      const response = await api.post(`${API_CHECKOUT_URL}/${orderId}/confirm`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to confirm checkout');
      }
      
      return response.data;
    } catch (error) {
      console.error('Confirm checkout error:', error);
      throw error.response?.data || error;
    }
  },

  cancelCheckout: async (orderId) => {
    try {
      await ensureToken();
      const response = await api.post(`${API_CHECKOUT_URL}/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel checkout error:', error);
      throw error.response?.data || error;
    }
  },

  // Payment operations
  createPaymentIntent: async (data) => {
    try {
      await ensureToken();
      const response = await api.post(`${API_CHECKOUT_URL}/create-payment-intent`, data);
      return response.data;
    } catch (// src/utils/cartApi.js (continued...)
      error) {
        console.error('Create payment intent error:', error);
        throw error.response?.data || error;
      }
    },
  
    confirmPayment: async (data) => {
      try {
        await ensureToken();
        const response = await api.post(`${API_CHECKOUT_URL}/confirm-payment`, data);
        return response.data;
      } catch (error) {
        console.error('Confirm payment error:', error);
        throw error.response?.data || error;
      }
    },
  
    // Get Stripe public key
    getStripeConfig: async () => {
      try {
        await ensureToken();
        const response = await api.get(`${API_CHECKOUT_URL}/config`);
        return response.data;
      } catch (error) {
        console.error('Get Stripe config error:', error);
        throw error.response?.data || error;
      }
    },
  
    // Process order specific operations
    getOrder: async (orderId) => {
      try {
        await ensureToken();
        const response = await api.get(`/orders/${orderId}`);
        return response.data;
      } catch (error) {
        console.error('Get order error:', error);
        throw error.response?.data || error;
      }
    },
  
    getAllOrders: async () => {
      try {
        await ensureToken();
        const response = await api.get('/orders');
        return response.data;
      } catch (error) {
        console.error('Get all orders error:', error);
        throw error.response?.data || error;
      }
    },
  
    updateOrderStatus: async (orderId, status) => {
      try {
        await ensureToken();
        const response = await api.patch(`/orders/${orderId}/status`, { status });
        return response.data;
      } catch (error) {
        console.error('Update order status error:', error);
        throw error.response?.data || error;
      }
    },
  
    // Cart manipulation methods
    addToCart: async (productId, quantity = 1) => {
      try {
        await ensureToken();
        const response = await api.post(API_CART_URL, { 
          productId, 
          quantity 
        });
        return response.data;
      } catch (error) {
        console.error('Add to cart error:', error);
        throw error.response?.data || error;
      }
    },
  
    updateCartItem: async (productId, quantity) => {
      try {
        await ensureToken();
        const response = await api.put(`${API_CART_URL}/items/${productId}`, { 
          quantity 
        });
        return response.data;
      } catch (error) {
        console.error('Update cart item error:', error);
        throw error.response?.data || error;
      }
    },
  
    removeFromCart: async (productId) => {
      try {
        await ensureToken();
        const response = await api.delete(`${API_CART_URL}/items/${productId}`);
        return response.data;
      } catch (error) {
        console.error('Remove from cart error:', error);
        throw error.response?.data || error;
      }
    },
  
    clearCart: async () => {
      try {
        await ensureToken();
        const response = await api.delete(`${API_CART_URL}/clear`);
        return response.data;
      } catch (error) {
        console.error('Clear cart error:', error);
        throw error.response?.data || error;
      }
    }
  };
  
  // Event emitter for cart updates
  export const emitCartUpdate = () => {
    window.dispatchEvent(new CustomEvent('cart-updated'));
  };
  
  // Helper function to handle payment redirect
  export const handlePaymentRedirect = async (orderId) => {
    try {
      await ensureToken();
      const orderStatus = await cartApi.getCheckoutStatus(orderId);
      
      if (orderStatus.status === 'success') {
        return { success: true, order: orderStatus.order };
      } else if (orderStatus.status === 'pending') {
        return { success: false, message: 'Payment is still processing' };
      } else {
        return { success: false, message: orderStatus.message || 'Payment failed' };
      }
    } catch (error) {
      console.error('Payment redirect error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to process payment' 
      };
    }
  };
  
  export default cartApi;