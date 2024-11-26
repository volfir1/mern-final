// utils/adminRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';
import { Loader2 } from 'lucide-react';

// Loading component
const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="text-sm text-gray-500">Loading...</p>
        </div>
    </div>
);
// Your RoleBasedRedirect with Firebase integration
export const RoleBasedRedirect = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('RoleBasedRedirect State:', {
            isAuthenticated,
            user,
            loading,
            token: localStorage.getItem('firebaseToken')
        });

        if (!loading) {
            if (isAuthenticated && user) {
                const targetPath = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
                console.log('Redirecting to:', targetPath);
                navigate(targetPath, { replace: true });
            } else {
                console.log('Redirecting to login');
                navigate('/login', { replace: true });
            }
        }
    }, [isAuthenticated, user, loading, navigate]);

    return <LoadingFallback />;
};

// Your AdminRoute with Firebase integration
export const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        console.log('AdminRoute State:', {
            user,
            isAuthenticated,
            loading,
            token: localStorage.getItem('firebaseToken'),
            currentPath: location.pathname
        });
    }, [user, isAuthenticated, loading, location]);

    if (loading) {
        return <LoadingFallback />;
    }

    if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user?.role !== 'admin') {
        console.log('Not admin, redirecting to unauthorized');
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

// Your UserRoute with Firebase integration
export const UserRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        console.log('UserRoute State:', {
            user,
            isAuthenticated,
            loading,
            token: localStorage.getItem('firebaseToken'),
            currentPath: location.pathname
        });
    }, [user, isAuthenticated, loading, location]);

    if (loading) {
        return <LoadingFallback />;
    }

    if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user?.role === 'admin') {
        console.log('Admin user in user route, redirecting to unauthorized');
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

// Your ProtectedRoute with Firebase integration
export const ProtectedRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingFallback />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user needs to verify email
    if (user && !user.emailVerified) {
        return <Navigate to="/verify-email" state={{ from: location }} replace />;
    }

    return children;
};


export const PublicRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Show loading state
    if (loading) {
        return <LoadingFallback />;
    }

    // Check if it's a verification route
    const isVerificationRoute = location.pathname === '/verify-email';
    const isResetPasswordRoute = location.pathname === '/reset-password';
    const isAuthFlow = isVerificationRoute || isResetPasswordRoute;

    // If it's a verification route and we have a user (even if not verified), show the page
    if (isVerificationRoute && user) {
        return children;
    }

    // If user is authenticated and it's not an auth flow, redirect to appropriate dashboard
    if (isAuthenticated && !isAuthFlow) {
        const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    // For non-authenticated users or auth flow routes, show the requested page
    return children;
};

// Your TokenVerifier with Firebase integration
export const TokenVerifier = () => {
    const { user, isAuthenticated } = useAuth();
    
    useEffect(() => {
        const verifyToken = async () => {
            try {
                const token = localStorage.getItem('firebaseToken');
                console.log('Current Token State:', {
                    token: token ? 'exists' : 'missing',
                    tokenLength: token?.length,
                    isAuthenticated,
                    user,
                    headers: token ? {
                        'Authorization': `Bearer ${token}`
                    } : 'no token'
                });
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        };

        verifyToken();
    }, [user, isAuthenticated]);

    return null;
};

export {
    LoadingFallback,
    AdminRoute as default
};