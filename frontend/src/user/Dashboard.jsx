// src/user/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../utils/authContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ShoppingBag, 
  Clock, 
  Heart,
  LogOut 
} from 'lucide-react';
import { CircularProgress } from '@mui/material';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const result = await logout();
      
      if (result?.accountDeleted) {
        // Account was deleted, redirect with message
        navigate('/login', { 
          state: { 
            message: 'Your account has been deleted. Please contact support if this was not intended.',
            type: 'warning'
          },
          replace: true
        });
      } else {
        // Normal logout
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect to login with error message
      navigate('/login', { 
        state: { 
          message: 'You have been logged out due to an error.',
          type: 'error'
        },
        replace: true
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Your existing stats data
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
                <p className="text-sm text-gray-500">Welcome back, {user?.displayName || user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <CircularProgress size={16} color="inherit" className="mr-2" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rest of your dashboard content remains the same */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
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

        {/* Quick Actions section remains the same */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left">
              <span className="block font-medium">View Orders</span>
              <span className="text-sm text-gray-500">Check your order history</span>
            </button>
            <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left">
              <span className="block font-medium">Edit Profile</span>
              <span className="text-sm text-gray-500">Update your information</span>
            </button>
            <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left">
              <span className="block font-medium">Wishlist</span>
              <span className="text-sm text-gray-500">View saved items</span>
            </button>
            <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left">
              <span className="block font-medium">Support</span>
              <span className="text-sm text-gray-500">Get help with your account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;