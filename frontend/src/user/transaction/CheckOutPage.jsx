// pages/CheckoutPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from './ChekoutForm';
import StripeEmbeddedPayment from '../payments/StripeEmbeddedPayment';
import { 
  Box,
  Container,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel 
} from '@mui/material';
import { ShoppingBag, CreditCard, LocalShipping } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { cartApi } from '@/api/cartApi';
import api from '@/utils/api';
import { TokenManager } from '@/utils/tokenManager';

const STEPS = [
  { label: 'Cart Review', icon: <ShoppingBag /> },
  { label: 'Shipping', icon: <LocalShipping /> },
  { label: 'Payment', icon: <CreditCard /> }
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    error: null,
    addresses: [],
    userData: null,
    cart: null,
    showStripePayment: false,
    paymentComplete: false,
    clientSecret: null,
    activeStep: 1
  });

  // Destructure state for easier access
  const {
    loading,
    error,
    addresses,
    userData,
    cart,
    showStripePayment,
    paymentComplete,
    clientSecret,
    activeStep
  } = state;

  // Helper function to update state
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Fetch initial data with proper error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verify auth token first
        const token = await TokenManager.getToken(true);
        if (!token) {
          toast.error('Please log in to continue');
          navigate('/login', { state: { from: '/user/checkout' } });
          return;
        }

        updateState({ loading: true });
        
        // Fetch cart and profile data in parallel
        const [cartResponse, profileResponse] = await Promise.all([
          cartApi.getCart(),
          api.get('/profile/me')
        ]);

        // Validate cart
        if (!cartResponse?.data?.items?.length) {
          toast.error('Your cart is empty');
          navigate('/user/cart');
          return;
        }

        // Validate profile
        const profileData = profileResponse.data;
        if (!profileData?.success || !profileData?.profile) {
          updateState({ 
            error: 'Please complete your profile before checkout',
            loading: false 
          });
          return;
        }

        // Process addresses
        const { primaryAddress, additionalAddresses = [] } = profileData.profile;
        const allAddresses = [
          ...(primaryAddress ? [primaryAddress] : []),
          ...additionalAddresses
        ];

        if (!allAddresses.length) {
          updateState({
            error: 'Please add a shipping address before checkout',
            loading: false
          });
          return;
        }

        // Update state with all fetched data
        updateState({
          addresses: allAddresses,
          userData: profileData.profile,
          cart: cartResponse.data,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Checkout data fetch error:', error);
        
        if (error.response?.status === 401) {
          toast.error('Please log in to continue');
          navigate('/login', { state: { from: '/user/checkout' } });
          return;
        }
        
        updateState({
          error: 'Failed to load checkout data. Please try again.',
          loading: false
        });
      }
    };

    fetchData();
  }, [navigate, updateState]);

  const handlePaymentSuccess = useCallback((secret) => {
    updateState({
      clientSecret: secret,
      paymentComplete: true,
      showStripePayment: false,
      activeStep: 3
    });
  }, [updateState]);

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      // Validate phone number format (matching your profile validation)
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(values.phone)) {
        setErrors({ phone: 'Please enter a valid Philippine mobile number (e.g., 09123456789)' });
        return;
      }

      if (values.paymentMethod === 'STRIPE' && !paymentComplete) {
        updateState({ showStripePayment: true });
        setSubmitting(false);
        return;
      }

      const checkoutData = {
        ...values,
        ...(clientSecret && { stripeClientSecret: clientSecret })
      };

      const response = await api.post('/api/checkout', checkoutData);

      if (response.data.success) {
        toast.success('Order placed successfully!');
        navigate(`/user/orders/${response.data.order._id}/confirmation`);
      } else {
        setErrors({ submit: response.data.message });
      }

    } catch (error) {
      console.error('Checkout error:', error);
      
      if (error.response?.status === 401) {
        navigate('/login', { state: { from: '/user/checkout' } });
        return;
      }

      setErrors({ 
        submit: error.response?.data?.message || 
                'Failed to process checkout. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gray-50">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className="py-8 mt-16">
        <Paper elevation={0} className="p-6 rounded-lg bg-white shadow-sm">
          <Alert 
            severity="warning" 
            className="mb-4"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => navigate('/user/profile')}
                className="ml-4"
              >
                Complete Profile
              </Button>
            }
          >
            <AlertTitle>Action Required</AlertTitle>
            {error}
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8 mt-16">
      <Paper elevation={0} className="p-6 rounded-lg bg-white shadow-sm">
        {/* Header */}
        <Typography variant="h4" component="h1" className="font-bold mb-6 text-gray-800">
          Checkout
        </Typography>

        {/* Stepper */}
        <Box className="mb-8">
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  StepIconComponent={() => (
                    <Box className={`w-10 h-10 rounded-full flex items-center justify-center 
                      ${index <= activeStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                    >
                      {step.icon}
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Order Summary */}
        <Box className="mb-8 p-4 bg-gray-50 rounded-lg">
          <Typography variant="h6" className="font-medium mb-4 text-gray-700">
            Order Summary
          </Typography>
          <Box className="flex justify-between mb-2">
            <Typography color="textSecondary">
              Subtotal ({cart?.items?.length} items)
            </Typography>
            <Typography>${cart?.total?.toFixed(2)}</Typography>
          </Box>
          <Box className="flex justify-between">
            <Typography color="textSecondary">Shipping</Typography>
            <Typography className="text-green-600">Free</Typography>
          </Box>
          <Box className="flex justify-between mt-4 pt-4 border-t border-gray-200">
            <Typography variant="subtitle1" className="font-bold">
              Total
            </Typography>
            <Typography variant="subtitle1" className="font-bold">
              ${cart?.total?.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Checkout Form */}
        <Box className="bg-white rounded-lg">
          <CheckoutForm 
            addresses={addresses}
            initialValues={{
              shippingAddressId: userData?.primaryAddress?._id || '',
              paymentMethod: '',
              email: userData?.email || '',
              phone: userData?.phone || '',
              contactPerson: userData?.firstName + ' ' + userData?.lastName
            }}
            cartItems={cart?.items || []}
            onSubmit={handleSubmit}
          />
        </Box>

        {/* Stripe Payment Modal */}
        <StripeEmbeddedPayment
          open={showStripePayment}
          onClose={() => updateState({ showStripePayment: false })}
          onSuccess={handlePaymentSuccess}
          amount={cart?.total || 0}
        />
      </Paper>
    </Container>
  );
};

export default CheckoutPage;