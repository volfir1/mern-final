import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authContext';
import {
  TextField,
  Button,
  IconButton,
  Paper,
  Typography,
  Box,
  Alert,
  InputAdornment,
  CircularProgress,
  Link,
  Container,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google
} from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [authError, setAuthError] = useState(null);

  // Constants
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 300; // 5 minutes in seconds

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' })); 
    }
    if (authError) {
      setAuthError(null);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) return;
    if (!validateForm()) return;
  
    try {
      setLoading(true);
      setAuthError(null);
  
      const result = await login(formData);
      
      if (result.success) {
        setLoginAttempts(0);
        // Let the RoleBasedRedirect handle the redirection
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Failed to sign in. Please try again.');
      
      setLoginAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          setIsLocked(true);
          setLockoutTimer(LOCKOUT_DURATION);
        }
        return newAttempts;
      });
    } finally {
      setLoading(false);
    }
  };
  // Handle Google Sign In
  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      await googleLogin();
    } catch (error) {
      console.error('Google login error:', error);
      setAuthError(error.message || 'Failed to sign in with Google');
    }
  };

  // Handle lockout timer
  useEffect(() => {
    let interval;
    if (isLocked && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockoutTimer]);

  // Check for existing lockout on mount
  useEffect(() => {
    const lockoutEnd = localStorage.getItem('loginLockoutEnd');
    if (lockoutEnd) {
      const now = Date.now();
      if (now >= parseInt(lockoutEnd)) {
        localStorage.removeItem('loginLockoutEnd');
        setIsLocked(false);
        setLoginAttempts(0);
      } else {
        const remainingTime = Math.ceil((parseInt(lockoutEnd) - now) / 1000);
        setLockoutTimer(remainingTime);
        setIsLocked(true);
      }
    }
  }, []);

  // Save lockout state
  useEffect(() => {
    if (isLocked) {
      const lockoutEnd = Date.now() + (lockoutTimer * 1000);
      localStorage.setItem('loginLockoutEnd', lockoutEnd.toString());
    } else {
      localStorage.removeItem('loginLockoutEnd');
    }
  }, [isLocked, lockoutTimer]);

  return (
    <Container 
      maxWidth="sm" 
      className="min-h-screen flex items-center justify-center"
    >
      <Paper 
        elevation={3} 
        className="w-full p-8 space-y-6"
      >
        <Box className="text-center space-y-2">
          <Typography variant="h4" className="font-bold">
            Welcome Back
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Sign in to access your account
          </Typography>
        </Box>

        {isLocked && (
          <Alert severity="error" className="mb-4">
            Account Temporarily Locked - Too many failed attempts.
            <br />
            Please try again in {Math.floor(lockoutTimer / 60)}:
            {(lockoutTimer % 60).toString().padStart(2, '0')}
          </Alert>
        )}

        {authError && (
          <Alert severity="error" className="mb-4">
            {authError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading || isLocked}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email className="text-gray-500" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            disabled={loading || isLocked}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock className="text-gray-500" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading || isLocked}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box className="flex justify-between items-center">
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/forgot-password')}
              disabled={loading || isLocked}
              className="text-blue-600 hover:text-blue-800"
            >
              Forgot password?
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/register')}
              disabled={loading || isLocked}
              className="text-blue-600 hover:text-blue-800"
            >
              Create account
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading || isLocked}
            className="h-12"
          >
            {loading ? (
              <Box className="flex items-center justify-center">
                <CircularProgress size={24} color="inherit" className="mr-2" />
                Signing in...
              </Box>
            ) : (
              'Sign In'
            )}
          </Button>

          <Divider className="my-6">
            <Typography variant="body2" color="textSecondary">
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            onClick={handleGoogleLogin}
            disabled={loading || isLocked}
            className="h-12"
          >
            Continue with Google
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;