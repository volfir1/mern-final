import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, Button, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { TokenManager } from '@/utils/tokenManager';

// Initialize stripe outside component to avoid recreating
let stripePromise = null;

// Function to get stripe public key and initialize stripe with error handling
const getStripePromise = async () => {
  if (!stripePromise) {
    try {
      const token = await TokenManager.getToken(true);
      const response = await fetch('/api/checkout/config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Stripe configuration');
      }
      
      const { publicKey } = await response.json();
      stripePromise = loadStripe(publicKey);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      throw error;
    }
  }
  return stripePromise;
};

const CheckoutForm = ({ amount, orderId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || loading) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      // Get fresh token
      const token = await TokenManager.getToken(true);

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        const confirmResponse = await fetch('/api/checkout/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderId: orderId,
          }),
        });

        if (!confirmResponse.ok) {
          throw new Error('Failed to confirm payment with server');
        }

        const confirmResult = await confirmResponse.json();
        
        if (confirmResult.success) {
          onSuccess(paymentIntent);
        } else {
          throw new Error(confirmResult.message || 'Payment confirmation failed');
        }
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'An error occurred during payment');
      onError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <Alert severity="error" className="mt-4">
          {errorMessage}
        </Alert>
      )}

      <Box className="mt-4 bg-gray-50 p-4 rounded-lg">
        <Typography variant="h6" className="font-medium text-gray-900">
          Payment Summary
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          Amount to Pay: ₱{amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </Typography>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={!stripe || loading}
        className="bg-blue-600 hover:bg-blue-700 mt-4 py-3"
      >
        {loading ? (
          <Box className="flex items-center justify-center">
            <CircularProgress size={20} className="mr-2" />
            Processing...
          </Box>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
};

const StripePayment = ({ open, onClose, onSuccess, onError, amount, orderId }) => {
  const [state, setState] = useState({
    clientSecret: null,
    loading: true,
    error: null,
    stripe: null
  });

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializePayment = async () => {
      if (!open || !amount || !orderId) return;

      try {
        updateState({ loading: true, error: null });

        // Initialize Stripe first
        const stripe = await getStripePromise();
        if (!mounted) return;

        // Get fresh token
        const token = await TokenManager.getToken(true);

        // Create payment intent
        const response = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: amount,
            orderId: orderId
          }),
        });

        if (!mounted) return;

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Could not initialize payment');
        }

        updateState({
          clientSecret: data.clientSecret,
          stripe: stripe,
          loading: false
        });
      } catch (err) {
        console.error('Payment initialization error:', err);
        if (mounted) {
          updateState({
            error: err.message || 'Could not initialize payment',
            loading: false
          });
          onError?.(err.message || 'Payment initialization failed');
        }
      }
    };

    initializePayment();

    return () => {
      mounted = false;
    };
  }, [open, amount, orderId, updateState, onError]);

  const { clientSecret, loading, error, stripe } = state;

  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "rounded-lg"
      }}
    >
      <DialogContent className="p-6">
        <Typography variant="h5" component="h2" className="font-bold mb-6">
          Credit Card Payment
        </Typography>
        
        {loading && (
          <Box className="flex flex-col items-center justify-center py-8">
            <CircularProgress />
            <Typography className="mt-4 text-gray-600">
              Initializing payment...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            className="mb-4"
            action={
              <Button color="inherit" size="small" onClick={onClose}>
                Close
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        {!loading && !error && clientSecret && stripe && (
          <Elements 
            stripe={stripe}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#2563eb',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <CheckoutForm 
              amount={amount} 
              orderId={orderId}
              onSuccess={onSuccess}
              onError={onError}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StripePayment;