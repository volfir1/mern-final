// src/user/reviews/ReviewModal.jsx
import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  TextField,
  Box,
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import PropTypes from 'prop-types';

const reviewValidationSchema = Yup.object().shape({
  rating: Yup.number()
    .min(1, 'Please select a rating')
    .max(5, 'Invalid rating')
    .required('Rating is required'),
  comment: Yup.string()
    .trim()
    .max(500, 'Comment must be less than 500 characters')
});

const ReviewModal = ({ open, onClose, product, onSubmit, submitting }) => {
  const initialValues = {
    rating: 0,
    comment: '',
    productId: product?.productId || '',
    orderId: product?.orderId || ''
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Formik
        initialValues={initialValues}
        validationSchema={reviewValidationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            await onSubmit(values);
            resetForm();
            onClose();
          } catch (error) {
            console.error('Review submission failed:', error);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue,
          isSubmitting
        }) => (
          <Form>
            <DialogTitle>Review {product?.name}</DialogTitle>
            {submitting && <LinearProgress />}
            
            <DialogContent>
              <Box className="space-y-6">
                <Box className="space-y-2">
                  <Typography component="legend">Your Rating</Typography>
                  <Rating
                    name="rating"
                    value={values.rating}
                    onChange={(_, value) => setFieldValue('rating', value)}
                    precision={0.5}
                    size="large"
                  />
                  {errors.rating && touched.rating && (
                    <Typography color="error" variant="caption">
                      {errors.rating}
                    </Typography>
                  )}
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="comment"
                  label="Your Review (Optional)"
                  value={values.comment}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.comment && Boolean(errors.comment)}
                  helperText={
                    (touched.comment && errors.comment) || 
                    `${values.comment.length}/500`
                  }
                  inputProps={{ maxLength: 500 }}
                  disabled={submitting}
                />
              </Box>
            </DialogContent>

            <DialogActions className="p-4">
              <Button 
                onClick={onClose} 
                disabled={isSubmitting || submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                disabled={isSubmitting || submitting || !values.rating}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

ReviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    productId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    orderId: PropTypes.string.isRequired
  }),
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool
};

export default ReviewModal;