// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { auth, authUtils } from '../config/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        try {
            setError(null);
            const user = await authUtils.signIn(email, password);
            return user;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const signUp = async (email, password) => {
        try {
            setError(null);
            const user = await authUtils.signUp(email, password);
            return user;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            await authUtils.signOut();
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    return {
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        ...authUtils
    };
};