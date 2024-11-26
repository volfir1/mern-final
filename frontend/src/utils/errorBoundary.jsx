import React, { Component } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Box,
  Paper,
  Collapse
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error logged from ErrorBoundary: ", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4
          }}
        >
          <Card
            elevation={3}
            sx={{
              maxWidth: 500,
              width: '100%',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <CardHeader
              title={
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img
                    src="/api/placeholder/100/100"
                    alt="Gadget Galaxy Logo"
                    style={{
                      height: 64,
                      width: 64,
                      margin: '0 auto',
                      marginBottom: 16
                    }}
                  />
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Gadget Galaxy
                  </Typography>
                </Box>
              }
            />

            <CardContent sx={{ pt: 0 }}>
              <Alert 
                severity="error" 
                icon={<ErrorIcon />}
                sx={{ mb: 3 }}
              >
                <AlertTitle>Something went wrong</AlertTitle>
                We've encountered an unexpected error.
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Collapse in={true}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      mb: 3,
                      borderRadius: 1,
                      '& pre': {
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }
                    }}
                  >
                    <Typography color="error" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {this.state.error.toString()}
                    </Typography>
                    {this.state.errorInfo && (
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    )}
                  </Paper>
                </Collapse>
              )}

              <Box sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
                <Typography variant="body1" paragraph>
                  Don't worry, we're working on fixing this issue.
                </Typography>
                <Typography variant="body1">
                  Please try refreshing the page or come back later.
                </Typography>
              </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </CardActions>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;