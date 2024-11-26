// App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './utils/errorBoundary';
import AdminRoute, { UserRoute, PublicRoute, RoleBasedRedirect } from './utils/adminRoute';
import { AuthProvider } from "./utils/authContext";
import { Loader2 } from "lucide-react";


// Lazy load components
const AdminDashboard = lazy(() => import("./admin/Dashboard"));
const UserDashboard = lazy(() => import("./user/Dashboard"));
const ProductsDemo = lazy(() => import("./admin/product/Products"));
const Suppliers = lazy(() => import("@/admin/supplier/Supplier"));
const Settings = lazy(() => import("./components/others/Settings"));
const Login = lazy(() => import("./auth/Login"));
const Register = lazy(() => import("./auth/Register"));
const Unauthorized = lazy(() => import("./components/Unauthorized"));
const EmailVerification = lazy(() => import("./auth/EmailVerfication"));
const ResetPassword = lazy(() => import("./auth/ResetPassword"));
const ForgotPassword = lazy(() => import("./auth/ForgotPassword"));


// Category with dynamic import
const Category = lazy(() => import("./admin/category/Category").then(module => {
  return { default: module.default };
}));

// LoadingFallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      suspense: false,
      useErrorBoundary: true,
      onError: (error) => {
        if (error?.response?.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    },
    mutations: {
      useErrorBoundary: true,
    },
  },
});

// Route configurations
const routes = {
  public: [
    { path: "/login", element: Login },
    { path: "/register", element: Register },
    { path: "/verify-email", element: EmailVerification }, // Should be in public routes
    { path: "/reset-password", element: ResetPassword},
    { path: "/forgot-password", element: ForgotPassword},
  ],
  auth: [
    { path: "/unauthorized", element: Unauthorized },
  ],
  admin: [
    { path: "/admin/dashboard", element: AdminDashboard },
    { path: "/admin/products", element: ProductsDemo },
    { path: "/admin/suppliers", element: Suppliers },
    { path: "/admin/settings", element: Settings },
    { path: "/admin/categories", element: Category },
  ],
  user: [
    { path: "/user/dashboard", element: UserDashboard },
  ]
};

// NotFound component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900">Page not found</h2>
      <p className="mt-2 text-gray-600">Sorry, we couldn't find the page you're looking for.</p>
    </div>
  </div>
);

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <div className="flex min-h-screen">
                <main className="flex-1 pb-8">
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Root redirect */}
                      <Route 
                        path="/" 
                        element={<RoleBasedRedirect />} 
                      />

                      {/* Public Routes */}
                      {routes.public.map(({ path, element: Element }) => (
                        <Route
                          key={path}
                          path={path}
                          element={
                            <PublicRoute>
                              <ErrorBoundary>
                                <Suspense fallback={<LoadingFallback />}>
                                  <Element />
                                </Suspense>
                              </ErrorBoundary>
                            </PublicRoute>
                          }
                        />
                      ))}

                      {/* Auth Routes */}
                      {routes.auth.map(({ path, element: Element }) => (
                        <Route
                          key={path}
                          path={path}
                          element={
                            <ErrorBoundary>
                              <Suspense fallback={<LoadingFallback />}>
                                <Element />
                              </Suspense>
                            </ErrorBoundary>
                          }
                        />
                      ))}

                      {/* Admin Routes */}
                      {routes.admin.map(({ path, element: Element }) => (
                        <Route
                          key={path}
                          path={path}
                          element={
                            <AdminRoute>
                              <ErrorBoundary>
                                <Suspense fallback={<LoadingFallback />}>
                                  <Element />
                                </Suspense>
                              </ErrorBoundary>
                            </AdminRoute>
                          }
                        />
                      ))}

                      {/* User Routes */}
                      {routes.user.map(({ path, element: Element }) => (
                        <Route
                          key={path}
                          path={path}
                          element={
                            <UserRoute>
                              <ErrorBoundary>
                                <Suspense fallback={<LoadingFallback />}>
                                  <Element />
                                </Suspense>
                              </ErrorBoundary>
                            </UserRoute>
                          }
                        />
                      ))}

                      {/* 404 Route */}
                      <Route 
                        path="*" 
                        element={
                          <ErrorBoundary>
                            <NotFound />
                          </ErrorBoundary>
                        } 
                      />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </div>
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
};

export default App;