    import api from '@/utils/api';
    import axios from 'axios';
    import { auth } from '../config/firebase.config';

    const API_ENDPOINTS = {
    base: '/profile',
    me: '/profile/me',
    address: '/profile/address',
    addressPrimary: (id) => `/profile/address/${id}/primary`,
    };

    const CLOUDINARY_CONFIG = {
    uploadUrl: `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    };


    const getAuthToken = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            const newToken = await auth.currentUser?.getIdToken(true);
            if (newToken) {
              localStorage.setItem('accessToken', newToken);
              return newToken;
            }
            throw new Error('No authentication token available');
          }
          return token;
        } catch (error) {
          console.error('Get auth token error:', error);
          throw new Error('Authentication failed. Please login again.');
        }
      };

      
    const uploadToCloudinary = async (file) => {
    try {
        if (!file) return null;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        
        const response = await axios.post(CLOUDINARY_CONFIG.uploadUrl, formData);
        return response.data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image');
    }
    };

    export const getProfile = async () => {
        try {
          const token = await getAuthToken();
          const response = await api.get(API_ENDPOINTS.me, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return response;
        } catch (error) {
          console.error('Get profile error:', error);
          throw error;
        }
      };
      

      export const updateProfile = async (data) => {
        try {
          const token = await getAuthToken();
          
          const config = {
            headers: { 
              'Authorization': `Bearer ${token}`,
              ...(data instanceof FormData 
                ? { 'Content-Type': 'multipart/form-data' }
                : { 'Content-Type': 'application/json' }
              )
            }
          };
      
          const response = await api.put(API_ENDPOINTS.me, data, config);
          return response;
        } catch (error) {
          console.error('Update profile error:', error);
          throw error;
        }
      };
      

      export const addAddress = async (addressData) => {
        try {
          const token = await getAuthToken();
          const response = await api.post(API_ENDPOINTS.address, addressData, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return response;
        } catch (error) {
          console.error('Add address error:', error);
          throw error;
        }
      };
      

      export const setPrimaryAddress = async (addressId) => {
        try {
          const token = await getAuthToken();
          const response = await api.put(API_ENDPOINTS.addressPrimary(addressId), null, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return response;
        } catch (error) {
          console.error('Set primary address error:', error);
          throw error;
        }
      };
      


      export const deleteAddress = async (addressId) => {
        try {
          const token = await getAuthToken();
          const response = await api.delete(`${API_ENDPOINTS.address}/${addressId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return response;
        } catch (error) {
          console.error('Delete address error:', error);
          throw error;
        }
      };

    export const profileApi = {
    getProfile,
    updateProfile,
    addAddress,
    setPrimaryAddress,
    deleteAddress
    };

    export default profileApi;