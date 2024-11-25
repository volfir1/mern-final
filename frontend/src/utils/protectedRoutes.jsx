// ProtectedRoutes.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoadingSpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
    <div className="w-12 h-12 border-4 border-blue-500 rounded-full animate-spin border-t-transparent" />
  </div>
);

const withAuth = (Component, { 
  requireAuth = true, 
  allowedRoles = null,
  publicOnly = false 
}) => {
  return function AuthWrapper(props) {
    const { user, loading, roleLoaded, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading || !roleLoaded) {
      return <LoadingSpinner />;
    }

    // Handle public only routes (login, register, etc.)
    if (publicOnly) {
      if (isAuthenticated) {
        const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
      }
      return <Component {...props} />;
    }

    // Handle protected routes
    if (requireAuth && !isAuthenticated) {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Handle role-based access
    if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
      const defaultPath = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      return <Navigate to={defaultPath} replace />;
    }

    return <Component {...props} />;
  };
};

export const ProtectedRoute = ({ children, allowedRoles = ['user', 'admin'] }) => {
  const WrappedComponent = () => <>{children}</>;
  const Protected = withAuth(WrappedComponent, { allowedRoles });
  return <Protected />;
};

export const AdminRoute = ({ children }) => {
  const WrappedComponent = () => <>{children}</>;
  const Protected = withAuth(WrappedComponent, { allowedRoles: ['admin'] });
  return <Protected />;
};

export const UserRoute = ({ children }) => {
  const WrappedComponent = () => <>{children}</>;
  const Protected = withAuth(WrappedComponent, { allowedRoles: ['user'] });
  return <Protected />;
};

export const PublicRoute = ({ children }) => {
  const WrappedComponent = () => <>{children}</>;
  const Public = withAuth(WrappedComponent, { requireAuth: false, publicOnly: true });
  return <Public />;
};

export const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
  return <Navigate to={redirectPath} replace />;
};

export default {
  ProtectedRoute,
  AdminRoute,
  UserRoute,
  PublicRoute,
  RoleBasedRedirect
};