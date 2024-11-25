// components/EmailVerification.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authContext';
import {
  Box, Container, Typography, Button, Alert, Paper,
  CircularProgress, useTheme, Divider
} from '@mui/material';
import { MarkEmailRead, Email as EmailIcon, ArrowBack, Refresh } from '@mui/icons-material';

const EmailVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { resendVerificationEmail } = useAuth();

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
    email: location.state?.email,
    message: location.state?.message,
    resendCooldown: 0
  });

  useEffect(() => {
    if (!status.email) {
      navigate('/login', { replace: true });
    }
  }, [status.email, navigate]);

  const handleResendLink = async () => {
    if (status.resendCooldown > 0) return;

    try {
      setStatus(prev => ({
        ...prev,
        loading: true,
        error: null,
        success: null
      }));

      const response = await resendVerificationEmail(status.email);
      
      setStatus(prev => ({
        ...prev,
        success: response.message || 'Verification email sent successfully!',
        resendCooldown: 60
      }));

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error.message || 'Failed to resend verification email'
      }));
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    let timer;
    if (status.resendCooldown > 0) {
      timer = setInterval(() => {
        setStatus(prev => ({
          ...prev,
          resendCooldown: prev.resendCooldown - 1
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status.resendCooldown]);

  return (
    <Container maxWidth="sm">
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ 
            width: 80,
            height: 80,
            margin: '0 auto',
            bgcolor: 'primary.light',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}>
            <EmailIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>

          <Typography variant="h4" align="center" gutterBottom>
            Verify your email
          </Typography>

          {status.error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {status.error}
            </Alert>
          )}

          {status.success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {status.success}
            </Alert>
          )}

          {status.message && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {status.message}
            </Alert>
          )}

          <Typography align="center" sx={{ mb: 2 }}>
            We've sent a verification link to:
          </Typography>

          <Typography variant="h6" align="center" sx={{ 
            color: 'primary.main',
            fontWeight: 500,
            mb: 3
          }}>
            {status.email}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleResendLink}
            disabled={status.loading || status.resendCooldown > 0}
            startIcon={status.loading ? <CircularProgress size={20} /> : <Refresh />}
            sx={{ mb: 2 }}
          >
            {status.loading ? 'Sending...' : 
             status.resendCooldown > 0 ? `Resend in ${status.resendCooldown}s` : 
             'Resend verification email'}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
            startIcon={<ArrowBack />}
          >
            Back to login
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 4, color: 'text.secondary' }}>
            Please check your spam folder if you don't see the email in your inbox
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerification;