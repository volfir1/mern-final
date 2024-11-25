// Create a new component: components/routes/PublicRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../utils/authContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  // If authenticated, redirect based on role
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;