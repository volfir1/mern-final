// components/AuthCheck.jsx
import { useEffect } from 'react';
import { useAuth } from '../utils/authContext';

const AuthCheck = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log('Current auth state:', {
      user,
      token: localStorage.getItem('token'),
      authHeader: `Bearer ${localStorage.getItem('token')}`
    });
  }, [user]);

  return null;
};

export default AuthCheck;