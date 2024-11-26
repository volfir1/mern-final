import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  CreditCard as PaymentIcon,
  AttachMoney as CashIcon,
  Home as HomeIcon,
  LocationOn,
  Work
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from "@/utils/api";

const CheckoutForm = ({ cartItems = [] }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    image: { url: '' },
    primaryAddress: null,
    additionalAddresses: []
  });
  
  // Initialize with defaults
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD');

  // Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/me');
        if (response.data.success) {
          setProfile(response.data.profile);
          // Set default selected address to primary address if it exists
          if (response.data.profile.primaryAddress) {
            setSelectedAddressId(response.data.profile.primaryAddress._id);
          }
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load profile');
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Submitting with data:', {
        shippingAddressId: selectedAddressId,
        paymentMethod: selectedPaymentMethod
      });

      // Step 1: Create order with required fields
      const orderResponse = await api.post('/checkout', {
        shippingAddressId: selectedAddressId,
        paymentMethod: selectedPaymentMethod
      });
      
      if (orderResponse.data.success) {
        // Extract the order ID from the response
        const orderId = orderResponse.data.data._id; // Make sure this matches your API response structure
        console.log('Order created with ID:', orderId);
        
        if (!orderId) {
          throw new Error('No order ID received from server');
        }
        
        // Step 2: Confirm the order with the orderId
        const confirmResponse = await api.post(`/checkout/${orderId}/confirm`);
        
        if (confirmResponse.data.success) {
          // Step 3: Clear cart
          await api.delete('/cart/clear');
          
          toast.success('Order placed successfully! 🎉');
          
          // Step 4: Redirect after a brief delay
          setTimeout(() => {
            navigate('/user/orders');
          }, 1500);
        } else {
          throw new Error(confirmResponse.data.message || 'Failed to confirm order');
        }
      } else {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Order submission error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to place order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Combine addresses for select menu
  const allAddresses = [
    ...(profile.primaryAddress ? [profile.primaryAddress] : []),
    ...profile.additionalAddresses
  ];

  const getAddressIcon = (label) => {
    switch (label) {
      case 'Home':
        return <HomeIcon />;
      case 'Work':
        return <Work />;
      default:
        return <LocationOn />;
    }
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 450.00;

  // Rest of the JSX remains the same...
  return (
    <Box className="max-w-4xl mx-auto p-4">
      <Grid container spacing={4}>
        {/* Left Column - Form */}
        <Grid item xs={12} md={8}>
          {error && (
            <Alert 
              severity="error" 
              className="mb-4" 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Paper elevation={2} className="p-6">
            {/* Shipping Section */}
            <Box mb={4}>
              <Typography variant="h6" className="flex items-center gap-2 mb-4">
                <ShippingIcon /> Shipping Address
              </Typography>
              
              <FormControl fullWidth variant="outlined" error={!selectedAddressId}>
                <InputLabel>Select Address</InputLabel>
                <Select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  label="Select Address"
                >
                  {allAddresses.map((address) => (
                    <MenuItem key={address._id} value={address._id}>
                      <Box className="flex items-center">
                        {getAddressIcon(address.label)}
                        <Box ml={1}>
                          <Typography variant="subtitle2">
                            {address.label} Address
                            {profile.primaryAddress?._id === address._id && 
                              " (Primary)"}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {address.street}, {address.barangay}, {address.city}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Payment Section */}
            <Box mt={4}>
              <Typography variant="h6" className="flex items-center gap-2 mb-4">
                <PaymentIcon /> Payment Method
              </Typography>
              
              <FormControl fullWidth variant="outlined" error={!selectedPaymentMethod}>
                <InputLabel>Select Payment Method</InputLabel>
                <Select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  label="Select Payment Method"
                >
                  <MenuItem value="COD">
                    <Box className="flex items-center gap-2">
                      <CashIcon />
                      Cash on Delivery
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box mt={4}>
              <Button
                onClick={handleSubmit}
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !selectedAddressId || !selectedPaymentMethod}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Box className="flex items-center justify-center gap-2">
                    <CircularProgress size={20} color="inherit" />
                    Processing...
                  </Box>
                ) : (
                  'Place Order'
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="p-6">
            <Typography variant="h6" className="flex items-center gap-2 mb-4">
              <CartIcon /> Order Summary
            </Typography>

            <Box className="space-y-4">
              {cartItems.map((item) => (
                <Box key={item._id} className="flex gap-4">
                  <img
                    src={item.image || '/api/placeholder/80/80'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <Box className="flex-1">
                    <Typography variant="subtitle2">
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Quantity: {item.quantity}
                    </Typography>
                    <Typography variant="subtitle2">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}

              <Divider />

              <Box className="space-y-2">
                <Box className="flex justify-between">
                  <Typography>Subtotal</Typography>
                  <Typography>₱{cartTotal.toFixed(2)}</Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography>Shipping</Typography>
                  <Typography className="text-green-600">Free</Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="subtitle1" className="font-bold">
                    Total
                  </Typography>
                  <Typography variant="subtitle1" className="font-bold">
                    ₱{cartTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CheckoutForm;