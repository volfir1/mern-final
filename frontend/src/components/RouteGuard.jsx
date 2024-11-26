// utils/adminRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';

export const ProtectedRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    // Check if user exists but email is not verified
    if (user && !user.emailVerified) {
        return <Navigate 
            to="/verify-email" 
            state={{ 
                from: location,
                email: user.email,
                requiresVerification: true 
            }} 
            replace 
        />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    // Check if user exists but email is not verified
    if (user && !user.emailVerified) {
        return <Navigate 
            to="/verify-email" 
            state={{ 
                from: location,
                email: user.email,
                requiresVerification: true 
            }} 
            replace 
        />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export const UserRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    // Check if user exists but email is not verified
    if (user && !user.emailVerified) {
        return <Navigate 
            to="/verify-email" 
            state={{ 
                from: location,
                email: user.email,
                requiresVerification: true 
            }} 
            replace 
        />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export const PublicRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (isAuthenticated && user?.emailVerified) {
        return <Navigate to="/" replace />;
    }

    return children;
};