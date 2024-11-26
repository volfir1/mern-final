import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, IconButton, InputAdornment, Alert, CircularProgress } from '@mui/material';
import { Google, Visibility, VisibilityOff } from '@mui/icons-material';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import axios from 'axios';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*]/, 'Password must contain at least one special character')
    .required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      setMessageType(location.state.type || 'info');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsLoggingIn(true);
      setError('');
      setMessage('');

      const { email, password } = values;

      const response = await axios.post('/api/auth/login', { email, password }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { data, requiresVerification } = response.data;

      if (requiresVerification) {
        setMessage(data.message || 'Verification email has been sent');
        navigate('/verify-email', { 
          state: { email, verificationLink: data.verificationLink, fromLogin: true },
          replace: true
        });
        return;
      }

      const targetPath = data.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoggingIn(false);
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoggingIn(true);
      setError('');
      setMessage('');

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      const response = await axios.post('/api/auth/google', { idToken: credential.idToken }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'success') {
        const userData = response.data.data.user;
        const targetPath = userData.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        navigate(targetPath, { replace: true });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">create a new account</Link>
          </p>
        </div>

        {message && (
          <Alert 
            severity={messageType}
            onClose={() => setMessage('')}
            className="mb-4"
          >
            {message}
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            className="mb-4"
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, handleChange, handleBlur, values }) => (
            <Form className="mt-8 space-y-6">
              <div className="rounded-md space-y-4">
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  disabled={isLoggingIn || isGoogleLoggingIn}
                />

                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  disabled={isLoggingIn || isGoogleLoggingIn}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={isLoggingIn || isGoogleLoggingIn}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link 
                    to="/reset-password" 
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || isLoggingIn || isGoogleLoggingIn}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center justify-center">
                      <CircularProgress size={24} color="inherit" className="mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleSignIn}
                  startIcon={<Google />}
                  disabled={isLoggingIn || isGoogleLoggingIn}
                  className="border-gray-300"
                >
                  {isGoogleLoggingIn ? (
                    <div className="flex items-center justify-center">
                      <CircularProgress size={24} color="inherit" className="mr-2" />
                      Signing in with Google...
                    </div>
                  ) : (
                    'Sign in with Google'
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;