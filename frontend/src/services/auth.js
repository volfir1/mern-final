// src/services/authService.js
import axios from 'axios';
import { auth } from '../config/firebase.config';

const API_URL = '/api/auth';

export const authService = {
    async register(email, password) {
        const response = await axios.post(`${API_URL}/register`, { email, password });
        return response.data;
    },

    async login(email, password) {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        return response.data;
    },

    async googleSignIn() {
        const response = await axios.post(`${API_URL}/google-signin`);
        return response.data;
    },

    async verifyEmail(email) {
        const response = await axios.post(`${API_URL}/verify-email`, { email });
        return response.data;
    },

    async updateProfile(userData) {
        const response = await axios.put(`${API_URL}/profile`, userData);
        return response.data;
    },

    async deleteAccount() {
        await axios.delete(`${API_URL}/delete-account`);
    },

    async signOut() {
        await auth.signOut();
        await axios.post(`${API_URL}/logout`);
    }
};