// pages/CheckoutPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from './ChekoutForm';
import StripeEmbeddedPayment from '../payments/StripeEmbeddedPayment';
import { Box, CircularProgress, Alert } from '@mui/material';
import { toast } from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [cart, setCart] = useState(null);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile, addresses and cart data
        const [profileRes, cartRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/cart')
        ]);

        const [profileData, cartData] = await Promise.all([
          profileRes.json(),
          cartRes.json()
        ]);

        // Validate cart
        if (!cartData.success || !cartData.data?.items?.length) {
          navigate('/cart');
          toast.error('Your cart is empty');
          return;
        }

        // Validate user profile
        if (!profileData.success || !profileData.data) {
          setError('Please complete your profile before checkout');
          return;
        }

        // Validate user addresses
        const allAddresses = [
          ...(profileData.data.primaryAddress ? [profileData.data.primaryAddress] : []),
          ...(profileData.data.additionalAddresses || [])
        ];

        if (!allAddresses.length) {
          setError('Please add a shipping address before checkout');
          return;
        }

        setAddresses(allAddresses);
        setUserData(profileData.data);
        setCart(cartData.data);

      } catch (error) {
        console.error('Failed to load checkout data:', error);
        setError('Failed to load checkout data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handlePaymentSuccess = (secret) => {
    setClientSecret(secret);
    setPaymentComplete(true);
    setShowStripePayment(false);
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      if (values.paymentMethod === 'STRIPE' && !paymentComplete) {
        setShowStripePayment(true);
        setSubmitting(false);
        return;
      }

      const checkoutData = {
        ...values,
        ...(clientSecret && { stripeClientSecret: clientSecret })
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      });

      const data = await response.json();

      if (!data.success) {
        setErrors({ submit: data.message });
        return;
      }

      // Handle successful checkout
      toast.success('Order placed successfully!');
      navigate(`/user/orders/${data.order._id}/confirmation`);

    } catch (error) {
      console.error('Checkout error:', error);
      setErrors({ submit: 'Failed to process checkout. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="container mx-auto px-4 py-8">
        <Alert 
          severity="warning" 
          className="mb-4"
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/user/profile')}
            >
              Complete Profile
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CheckoutForm 
        addresses={addresses}
        initialValues={{
          shippingAddressId: '',
          paymentMethod: '',
          email: userData?.email || '',
          phone: userData?.phone || ''
        }}
        cartItems={cart?.items || []}
        onSubmit={handleSubmit}
      />

      <StripeEmbeddedPayment
        open={showStripePayment}
        onClose={() => setShowStripePayment(false)}
        onSuccess={handlePaymentSuccess}
        amount={cart?.total || 0}
      />
    </div>
  );
};

export default CheckoutPage;