// src/components/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/authContext';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Unauthorized Access
        </h2>
        <p className="text-gray-600 mb-8">
          Sorry, you don't have permission to access this page.
        </p>
        <Link
          to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;