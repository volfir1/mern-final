  import React, { useEffect } from 'react';
  import { useSearchParams, useNavigate } from 'react-router-dom';
  import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    CircularProgress,
    useTheme,
    Alert
  } from '@mui/material';
  import {
    CheckCircleOutline as SuccessIcon,
    ErrorOutline as ErrorIcon,
    Login as LoginIcon,
    Timer as TimerIcon
  } from '@mui/icons-material';
  import { useAuth } from '../utils/authContext';

  const EmailVerified = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { syncVerificationStatus } = useAuth();
    const [countdown, setCountdown] = React.useState(5);
    
    // Parse URL parameters
    const success = searchParams.get('success') === 'true';
    const error = decodeURIComponent(searchParams.get('error') || '');
    const email = decodeURIComponent(searchParams.get('email') || '');

    useEffect(() => {
      // Log verification status for debugging
      console.log('Email verification status:', { success, error, email });

      // Sync verification status with auth context if successful
      if (success) {
        syncVerificationStatus().catch(console.error);
      }
    }, [success, error, email, syncVerificationStatus]);

    // Handle countdown and auto-navigation
    useEffect(() => {
      let timer;
      if (success && countdown > 0) {
        timer = setInterval(() => {
          setCountdown(prev => prev - 1);
        }, 1000);

        if (countdown === 1) {
          navigate('/login', { replace: true });
        }
      }
      return () => clearInterval(timer);
    }, [success, countdown, navigate]);

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          bgcolor: theme.palette.background.default,
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            {/* Status Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: success ? 'success.light' : 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3
              }}
            >
              {success ? (
                <SuccessIcon
                  sx={{
                    fontSize: 40,
                    color: 'success.main'
                  }}
                />
              ) : (
                <ErrorIcon
                  sx={{
                    fontSize: 40,
                    color: 'error.main'
                  }}
                />
              )}
            </Box>

            {/* Title */}
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: success ? 'success.main' : 'error.main',
                mb: 3
              }}
            >
              {success ? 'Email Verified Successfully!' : 'Verification Failed'}
            </Typography>

            {/* Message */}
            {success ? (
              <>
                {email && (
                  <Alert
                    severity="success"
                    sx={{ mb: 3 }}
                  >
                    Your email ({email}) has been verified successfully.
                  </Alert>
                )}
                
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 3
                  }}
                >
                  You can now log in to your account and access all features.
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    mb: 4
                  }}
                >
                  <TimerIcon sx={{ color: theme.palette.text.secondary }} />
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Redirecting to login in {countdown} seconds...
                  </Typography>
                </Box>
              </>
            ) : (
              <Alert
                severity="error"
                sx={{ mb: 4 }}
              >
                {error || 'An unknown error occurred during verification. Please try again or contact support if the problem persists.'}
              </Alert>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login', { replace: true })}
                sx={{
                  py: 1.5,
                  bgcolor: success ? theme.palette.primary.main : theme.palette.error.main,
                  '&:hover': {
                    bgcolor: success ? theme.palette.primary.dark : theme.palette.error.dark,
                  }
                }}
              >
                {success ? 'Go to Login' : 'Return to Login'}
              </Button>

              {!success && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/verify-email')}
                  sx={{
                    py: 1.5,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    '&:hover': {
                      borderColor: theme.palette.error.dark,
                      bgcolor: 'error.lighter',
                    }
                  }}
                >
                  Try Again
                </Button>
              )}
            </Box>

            {/* Loading Indicator */}
            {success && countdown > 0 && (
              <Box sx={{ mt: 3 }}>
                <CircularProgress
                  size={20}
                  thickness={5}
                  sx={{
                    color: theme.palette.primary.main
                  }}
                />
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    );
  };

  export default EmailVerified;