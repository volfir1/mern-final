import { useState, useEffect } from 'react';
import { Dialog, DialogContent, Button, Box, Typography, CircularProgress } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize stripe outside component to avoid recreating
let stripePromise = null;

// Function to get stripe public key and initialize stripe
const getStripePromise = async () => {
  if (!stripePromise) {
    const response = await fetch('/api/checkout/config');
    const { publicKey } = await response.json();
    stripePromise = loadStripe(publicKey);
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
    setErrorMessage('');

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        onError(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        const confirmResponse = await fetch('/api/checkout/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderId: orderId,
          }),
        });

        const confirmResult = await confirmResponse.json();
        
        if (confirmResult.success) {
          onSuccess(paymentIntent);
        } else {
          throw new Error(confirmResult.message);
        }
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
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
      {errorMessage && (
        <Typography color="error" className="mt-2 text-sm">
          {errorMessage}
        </Typography>
      )}

      <Box className="mt-4">
        <Typography variant="body1" className="mb-2">
          Amount to Pay: ₱{amount?.toFixed(2)}
        </Typography>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={!stripe || loading}
        className="bg-blue-600 hover:bg-blue-700 mt-4"
      >
        {loading ? <CircularProgress size={24} /> : 'Pay Now'}
      </Button>
    </form>
  );
};

const StripePayment = ({ open, onClose, onSuccess, onError, amount, orderId }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create payment intent
        const response = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            orderId: orderId
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Could not initialize payment');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError(err.message || 'Could not initialize payment');
        onError?.(err.message || 'Payment initialization failed');
      } finally {
        setLoading(false);
      }
    };

    if (open && amount && orderId) {
      initializePayment();
    }
  }, [open, amount, orderId]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogContent>
        <Box className="p-4">
          <Typography variant="h6" className="mb-4">
            Credit Card Payment
          </Typography>
          
          {loading && (
            <Box className="flex justify-center p-4">
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Typography color="error" className="mb-4">
              {error}
            </Typography>
          )}
          
          {!loading && !error && clientSecret && (
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2563eb',
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
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default StripePayment;