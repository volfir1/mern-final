// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./utils/authContext";
import { Toaster } from 'react-hot-toast';

// Import your components
const AdminDashboard = lazy(() => import("./admin/Dashboard"));
const UserDashboard = lazy(() => import("./user/Dashboard"));
const ProductsDemo = lazy(() => import("./admin/product/Products"));
const Suppliers = lazy(() => import("./admin/supplier/Supplier"));
const Settings = lazy(() => import("./components/others/Settings"));
const Login = lazy(() => import("./auth/Login"));
const Register = lazy(() => import("./auth/Register"));
const Unauthorized = lazy(() => import("./components/Unauthorized"));
const EmailVerification = lazy(() => import("./auth/EmailVerfication"));
const ResetPassword = lazy(() => import("./auth/ResetPassword"));
const ForgotPassword = lazy(() => import("./auth/ForgotPassword"));
const Category = lazy(() => import("./admin/category/Category"));
const ProductDisplay = lazy(() => import("./user/products/ProductDisplay"));
const ProfileManagement = lazy(() => import('./user/profile/ProfileManagement'));
const CheckOut = lazy(()=>import('./user/transaction/CheckOutPage'));
const HomePage = lazy(()=> import('./HomePage'));

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 300000,
      cacheTime: 600000,
      suspense: false,
      useErrorBoundary: true,
      onError: (error) => {
        if (error?.response?.status === 401) {
          sessionStorage.clear();
          window.location.href = "/homepage";
        }
      },
    },
    mutations: {
      useErrorBoundary: true,
    },
  },
});

// NotFound Component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900">404: Page not found</h2>
      <p className="mt-2 text-gray-600">Sorry, we couldn't find the page you're looking for.</p>
    </div>
  </div>
);

// Route Components - Inside a component that has access to AuthContext
const AppRoutes = () => {
  const auth = useAuth();
  const location = useLocation();

  const PublicRoute = ({ children }) => {
    if (auth.loading || !auth.roleLoaded) {
      return <LoadingSpinner />;
    }

    if (auth.isAuthenticated && auth.user?.role) {
      const redirectPath = auth.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
    }

    return children;
  };

  const ProtectedRoute = ({ children, allowedRoles = ['user', 'admin'] }) => {
    if (auth.loading || !auth.roleLoaded) {
      return <LoadingSpinner />;
    }

    if (!auth.isAuthenticated) {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (!auth.user?.role || !allowedRoles.includes(auth.user.role)) {
      const defaultPath = auth.user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      return <Navigate to={defaultPath} replace />;
    }

    return children;
  };

  const AdminRoute = ({ children }) => (
    <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
  );

  const UserRoute = ({ children }) => (
    <ProtectedRoute allowedRoles={['user']}>{children}</ProtectedRoute>
  );

  return (
    <Routes>
      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Navigate to="/user/dashboard" replace />
          </ProtectedRoute>
        } 
      />

      {/* Public Routes */}
      <Route
        path="/homepage"
        element={
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <EmailVerification />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<ProductsDemo />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="settings" element={<Settings />} />
              <Route path="categories" element={<Category />} />
            </Routes>
          </AdminRoute>
        }
      />

      {/* User Routes */}
      <Route
        path="/user/*"
        element={
          <UserRoute>
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="products" element={<ProductDisplay />} />
              <Route path="profile" element={<ProfileManagement />} />
              <Route path="checkout" element={<CheckOut/>} />
            </Routes>
          </UserRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Root App Component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                padding: '16px',
              },
            }}
          />
          <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<LoadingSpinner />}>
              <AppRoutes />
            </Suspense>
          </div>
          {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default App;