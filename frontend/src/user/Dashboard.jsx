import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/authContext';
import { TokenManager } from '../utils/tokenManager';
import { auth } from '../config/firebase.config';
import { signOut } from 'firebase/auth';
import { 
  User, 
  ShoppingBag, 
  Clock, 
  Heart,
  LogOut,
  Loader2,
  Package, // Added for products icon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      TokenManager.clearAuth();
      localStorage.clear();
      await signOut(auth);
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const userStats = [
    {
      title: 'Recent Orders',
      icon: <ShoppingBag className="h-6 w-6 text-blue-500" />,
      value: '5',
      description: 'Last 30 days'
    },
    {
      title: 'Wishlist Items',
      icon: <Heart className="h-6 w-6 text-red-500" />,
      value: '12',
      description: 'Saved items'
    },
    {
      title: 'Last Purchase',
      icon: <Clock className="h-6 w-6 text-green-500" />,
      value: '2d ago',
      description: 'Latest activity'
    }
  ];

  const quickActions = [
    {
      title: 'Products',
      description: 'Browse all products',
      icon: <Package className="h-5 w-5 text-indigo-500 mb-2" />,
      path: '/user/products'
    },
    {
      title: 'View Orders',
      description: 'Check your order history',
      icon: <ShoppingBag className="h-5 w-5 text-blue-500 mb-2" />,
      path: '/user/orders'
    },
    {
      title: 'Wishlist',
      description: 'View saved items',
      icon: <Heart className="h-5 w-5 text-red-500 mb-2" />,
      path: '/user/wishlist'
    },
    {
      title: 'Edit Profile',
      description: 'Update your information',
      icon: <User className="h-5 w-5 text-green-500 mb-2" />,
      path: '/user/profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-gray-600" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">My Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.displayName || user?.email || 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
                ${isLoggingOut ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-50">
                  {stat.icon}
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(action.path)}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex flex-col items-start">
                  {action.icon}
                  <span className="block font-medium">{action.title}</span>
                  <span className="text-sm text-gray-500">{action.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;