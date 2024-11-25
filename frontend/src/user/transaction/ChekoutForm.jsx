// components/Checkout/CheckoutForm.jsx
import { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as CashIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import StripeEmbeddedPayment from '../payments/StripeEmbeddedPayment';

const CheckoutValidationSchema = Yup.object().shape({
  shippingAddressId: Yup.string()
    .required('Please select a shipping address'),
  paymentMethod: Yup.string()
    .required('Please select a payment method')
    .oneOf(['STRIPE', 'COD'], 'Invalid payment method'),
});

const CheckoutForm = ({ addresses, cartItems }) => {
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePaymentSuccess = (secret) => {
    setClientSecret(secret);
    setPaymentComplete(true);
    setShowStripePayment(false);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    if (values.paymentMethod === 'STRIPE' && !paymentComplete) {
      setShowStripePayment(true);
      setSubmitting(false);
      return;
    }

    try {
      // Submit order with payment details
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          stripeClientSecret: clientSecret
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Handle success (redirect to confirmation page)
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="max-w-7xl mx-auto px-4 py-8">
      <Grid container spacing={4}>
        {/* Left Column - Form */}
        <Grid item xs={12} md={8}>
          <Formik
            initialValues={{
              shippingAddressId: '',
              paymentMethod: ''
            }}
            validationSchema={CheckoutValidationSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              isSubmitting
            }) => (
              <Form>
                <Paper className="p-6 space-y-6">
                  {/* Shipping Section */}
                  <Box>
                    <Typography variant="h6" className="flex items-center gap-2 mb-4">
                      <ShippingIcon /> Shipping Address
                    </Typography>
                    
                    <FormControl 
                      fullWidth 
                      error={touched.shippingAddressId && Boolean(errors.shippingAddressId)}
                    >
                      <InputLabel>Select Address</InputLabel>
                      <Select
                        name="shippingAddressId"
                        value={values.shippingAddressId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        label="Select Address"
                      >
                        {addresses.map((address) => (
                          <MenuItem key={address._id} value={address._id}>
                            <Box>
                              <Typography variant="subtitle2">
                                {address.label}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {`${address.street}, ${address.city}`}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.shippingAddressId && errors.shippingAddressId && (
                        <FormHelperText>{errors.shippingAddressId}</FormHelperText>
                      )}
                    </FormControl>
                  </Box>

                  <Divider />

                  {/* Payment Section */}
                  <Box>
                    <Typography variant="h6" className="flex items-center gap-2 mb-4">
                      <CreditCardIcon /> Payment Method
                    </Typography>
                    
                    <FormControl 
                      fullWidth 
                      error={touched.paymentMethod && Boolean(errors.paymentMethod)}
                    >
                      <InputLabel>Select Payment Method</InputLabel>
                      <Select
                        name="paymentMethod"
                        value={values.paymentMethod}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        label="Select Payment Method"
                      >
                        <MenuItem value="STRIPE">
                          <Box className="flex items-center gap-2">
                            <CreditCardIcon /> Credit/Debit Card
                          </Box>
                        </MenuItem>
                        <MenuItem value="COD">
                          <Box className="flex items-center gap-2">
                            <CashIcon /> Cash on Delivery
                          </Box>
                        </MenuItem>
                      </Select>
                      {touched.paymentMethod && errors.paymentMethod && (
                        <FormHelperText>{errors.paymentMethod}</FormHelperText>
                      )}
                    </FormControl>
                  </Box>

                  {paymentComplete && (
                    <Alert severity="success">
                      Payment information verified - Ready to place order
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Place Order
                  </Button>
                </Paper>
              </Form>
            )}
          </Formik>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper className="p-6">
            <Typography variant="h6" className="flex items-center gap-2 mb-4">
              <CartIcon /> Order Summary
            </Typography>

            <Box className="space-y-4">
              {cartItems.map((item) => (
                <Box key={item._id} className="flex gap-4">
                  <img
                    src={item.image}
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
                  <Typography>Free</Typography>
                </Box>
                <Box className="flex justify-between font-bold">
                  <Typography>Total</Typography>
                  <Typography>₱{cartTotal.toFixed(2)}</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <StripeEmbeddedPayment
        open={showStripePayment}
        onClose={() => setShowStripePayment(false)}
        onSuccess={handlePaymentSuccess}
        amount={cartTotal}
      />
    </Box>
  );
};

export default CheckoutForm;