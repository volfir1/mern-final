import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Box, TextField, Button, Typography, Alert, Paper,
  InputAdornment, IconButton, CircularProgress,
  Snackbar, LinearProgress, Container, Avatar,
  Fade, Grow
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  HowToReg as RegisterIcon
} from '@mui/icons-material';
import api from '../utils/api'; // Using the API directly

// Enhanced password strength checker with better scoring
const getPasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    length10: password.length >= 10,
    multipleSpecial: (password.match(/[^A-Za-z0-9]/g) || []).length > 1
  };
  
  // Basic checks
  if (checks.length) strength += 20;
  if (checks.uppercase) strength += 20;
  if (checks.lowercase) strength += 20;
  if (checks.numbers) strength += 20;
  if (checks.special) strength += 20;
  
  // Bonus points
  if (checks.length10) strength += 10;
  if (checks.multipleSpecial) strength += 10;

  return Math.min(100, strength);
};

const getStrengthColor = (strength) => {
  if (strength >= 100) return '#2E7D32'; // Strong green
  if (strength >= 80) return '#388E3C'; // Green
  if (strength >= 60) return '#FFA000'; // Orange
  if (strength >= 40) return '#F57C00'; // Light orange
  return '#D32F2F'; // Red
};

const validationSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'Must be at least 2 characters')
    .matches(/^[a-zA-Z\s]*$/, 'First name can only contain letters')
    .trim(),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Must be at least 2 characters')
    .matches(/^[a-zA-Z\s]*$/, 'Last name can only contain letters')
    .trim(),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required')
    .lowercase(),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain: uppercase, lowercase, number, and special character'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password')
});

const Register = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    isSubmitting: false,
    error: null,
    passwordStrength: 0
  });

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setFormState(prev => ({
        ...prev,
        isSubmitting: true,
        error: null
      }));

      // Register using the API
      await api.authEndpoints.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.toLowerCase().trim(),
        password: values.password
      });

      // Redirect to verify email page after successful registration
      navigate('/verify-email', {
        state: { email: values.email.toLowerCase().trim() }
      });
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      }));
    } finally {
      setSubmitting(false);
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handlePasswordChange = (e, setFieldValue) => {
    const password = e.target.value;
    setFieldValue('password', password);
    setFormState(prev => ({
      ...prev,
      passwordStrength: getPasswordStrength(password)
    }));
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 8,
      }}>
        <Grow in timeout={1000}>
          <Paper elevation={6} sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: (theme) => `0 8px 24px ${theme.palette.primary.main}20`,
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 4 
            }}>
              <Avatar sx={{ 
                m: 1, 
                bgcolor: 'primary.main',
                width: 56,
                height: 56,
                boxShadow: 3
              }}>
                <RegisterIcon />
              </Avatar>
              <Typography variant="h4" component="h1" 
                sx={{
                  fontWeight: 700,
                  background: (theme) => 
                    `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  mb: 2
                }}
              >
                Create Account
              </Typography>
            </Box>

            <Snackbar
              open={!!formState.error}
              autoHideDuration={6000}
              onClose={() => setFormState(prev => ({ ...prev, error: null }))}
            >
              <Alert severity="error" elevation={6} variant="filled">
                {formState.error}
              </Alert>
            </Snackbar>

            <Formik
              initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: ''
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ handleChange, handleBlur, values, errors, touched, isSubmitting, setFieldValue }) => (
                <Form>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                      fullWidth
                      id="firstName"
                      name="firstName"
                      label="First Name"
                      value={values.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.firstName && Boolean(errors.firstName)}
                      helperText={touched.firstName && errors.firstName}
                      disabled={formState.isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="primary" />
                          </InputAdornment>
                        )
                      }}
                    />

                    <TextField
                      fullWidth
                      id="lastName"
                      name="lastName"
                      label="Last Name"
                      value={values.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.lastName && Boolean(errors.lastName)}
                      helperText={touched.lastName && errors.lastName}
                      disabled={formState.isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="primary" />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    disabled={formState.isSubmitting}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="primary" />
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    type={showPasswords.password ? 'text' : 'password'}
                    value={values.password}
                    onChange={(e) => {
                      handlePasswordChange(e, setFieldValue);
                      handleChange(e);
                    }}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    disabled={formState.isSubmitting}
                    sx={{ mb: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPasswords(prev => ({
                              ...prev,
                              password: !prev.password
                            }))}
                            edge="end"
                          >
                            {showPasswords.password ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  {values.password && (
                    <Fade in={!!values.password}>
                      <Box sx={{ mb: 3 }}>
                        <LinearProgress
                          variant="determinate"
                          value={formState.passwordStrength}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getStrengthColor(formState.passwordStrength),
                              transition: 'transform 0.4s ease, background-color 0.4s ease'
                            }
                          }}
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            mt: 1, 
                            display: 'block',
                            color: getStrengthColor(formState.passwordStrength)
                          }}
                        >
                          Password Strength: {
                            formState.passwordStrength >= 100 ? 'Very Strong' :
                            formState.passwordStrength >= 80 ? 'Strong' :
                            formState.passwordStrength >= 60 ? 'Good' :
                            formState.passwordStrength >= 40 ? 'Fair' :
                            'Weak'
                          }
                        </Typography>
                      </Box>
                    </Fade>
                  )}

                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                    helperText={touched.confirmPassword && errors.confirmPassword}
                    disabled={formState.isSubmitting}
                    sx={{ mb: 4 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPasswords(prev => ({
                              ...prev,
                              confirmPassword: !prev.confirmPassword
                            }))}
                            edge="end"
                          >
                            {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={formState.isSubmitting}
                    sx={{
                      py: 1.5,
                      mb: 3,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      background: (theme) => 
                        `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      '&:hover': {
                        background: (theme) => 
                          `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      }
                    }}
                  >
                    {formState.isSubmitting ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                        <Typography>Creating Your Account...</Typography>
                      </Box>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        fontWeight: 600,
                        borderBottom: '2px solid currentColor'
                      }}
                    >
                      Sign in
                    </Link>
                  </Typography>
                </Form>
              )}
            </Formik>
          </Paper>
        </Grow>
      </Box>
    </Container>
  );
};

export default Register;