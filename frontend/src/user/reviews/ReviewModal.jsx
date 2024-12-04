// src/components/ReviewModal.jsx

import React, { useState } from 'react';
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
  // State to handle backend errors
  const [error, setError] = useState(null);

  // Initial form values
  const initialValues = {
    rating: product?.userReview?.rating || 0,
    comment: product?.userReview?.comment || '',
    productId: product?.productId || '',
    orderId: product?.orderId || '',
    reviewId: product?.userReview?._id
  };

  const isEditMode = !!product?.userReview?._id;

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null); // Reset error state before submission
      await onSubmit(values); // Submit the review
      onClose(); // Close the modal upon successful submission
    } catch (err) {
      setError(err.message); // Display error message from backend
    } finally {
      setSubmitting(false); // End the submitting state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Review' : 'Write Review'}</DialogTitle>
      {submitting && <LinearProgress />}

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={reviewValidationSchema}
        onSubmit={handleSubmit}
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
            <DialogContent>
              <Box className="space-y-6">
                {/* Display Backend Error */}
                {error && (
                  <Alert severity="error" className="mx-4 mt-4">
                    {error}
                  </Alert>
                )}

                {/* Product Information */}
                <Box className="flex items-center gap-4">
                  <img
                    src={product?.images?.[0] || '/placeholder.jpg'}
                    alt={product?.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <Typography variant="h6">{product?.name}</Typography>
                </Box>

                {/* Rating Field */}
                <Box className="space-y-2">
                  <Typography component="legend">Rating</Typography>
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

                {/* Comment Field */}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="comment"
                  label="Your Review"
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
                color="primary"
                disabled={isSubmitting || submitting || !values.rating}
              >
                {submitting ? 'Submitting...' : isEditMode ? 'Update Review' : 'Submit Review'}
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
    orderId: PropTypes.string.isRequired,
    userReview: PropTypes.shape({
      _id: PropTypes.string,
      rating: PropTypes.number,
      comment: PropTypes.string
    })
  }),
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool
};

export default ReviewModal;
