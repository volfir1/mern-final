// src/components/common/LoadingFallback.jsx
import React from 'react';

const LoadingFallback = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
        <span className="text-gray-600">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingFallback;