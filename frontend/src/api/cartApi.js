// src/utils/cartApi.js
import api from '@/utils/api';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/config/firebase.config';

const CART_BASE_URL = '/cart';
const auth = getAuth(firebaseApp);

const ensureToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No user found');
      throw new Error('User not authenticated');
    }
    
    console.log('Getting token for user:', currentUser.uid);
    const token = await currentUser.getIdToken(true);
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    
    return token;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};

export const cartApi = {
  getCart: async () => {
    try {
      await ensureToken(); // Verify token before request
      const response = await api.get(CART_BASE_URL);
      console.log('Got cart:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get cart error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  addToCart: async (productId, quantity = 1) => {
    try {
      console.log('Adding to cart:', { productId, quantity });
      await ensureToken(); // Verify token before request

      const response = await api.post(CART_BASE_URL, {
        productId: productId.toString(),
        quantity: Math.max(1, parseInt(quantity))
      });

      console.log('Add to cart response:', response.data);
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return response.data;
    } catch (error) {
      console.error('Add to cart error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error.response?.data || error;
    }
  },

  updateCartItem: async (productId, quantity) => {
    try {
      console.log('Starting cart item update:', { productId, quantity });
      await ensureToken(); // Verify token before request

      const url = `${CART_BASE_URL}/items/${productId.toString()}`;
      console.log('Updating cart at URL:', url);

      const response = await api.put(url, {
        quantity: parseInt(quantity)
      });

      console.log('Cart update response:', response.data);
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return response.data;
    } catch (error) {
      console.error('Update cart error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error.response?.data || error;
    }
  },

  removeCartItem: async (productId) => {
    try {
      console.log('Starting cart item removal:', productId);
      await ensureToken(); // Verify token before request

      const url = `${CART_BASE_URL}/items/${productId.toString()}`;
      console.log('Removing cart item at URL:', url);

      const response = await api.delete(url);
      
      console.log('Remove item response:', response.data);
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return response.data;
    } catch (error) {
      console.error('Remove item error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error.response?.data || error;
    }
  },

  clearCart: async () => {
    try {
      await ensureToken(); // Verify token before request
      const response = await api.delete(`${CART_BASE_URL}/clear`);
      
      console.log('Clear cart response:', response.data);
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return response.data;
    } catch (error) {
      console.error('Clear cart error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error.response?.data || error;
    }
  }
};

export const emitCartUpdate = () => {
  window.dispatchEvent(new CustomEvent('cart-updated'));
};

export default cartApi;