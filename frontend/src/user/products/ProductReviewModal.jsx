import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Rating,
  IconButton,
  Avatar,
  Chip,
  Divider,
  DialogActions,
  Button
} from '@mui/material';
import { X } from 'lucide-react';
import { format } from 'date-fns';

const ProductReviewModal = ({ open, onClose, product, reviews = [] }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="flex justify-between items-center border-b">
        <div>
          <Typography variant="h6" className="font-semibold">
            {product?.name} - Reviews
          </Typography>
          <div className="flex items-center gap-2 mt-1">
            <Rating value={product?.rating || 0} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              ({reviews.length} reviews)
            </Typography>
          </div>
        </div>
        <IconButton onClick={onClose} size="small" className="hover:bg-gray-100">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className="min-h-[400px]">
        {reviews.length > 0 ? (
          <div className="space-y-6 py-4">
            {reviews.map((review) => (
              <Box key={review._id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar 
                      src={review.user?.photoURL} 
                      alt={review.user?.displayName || 'User'}
                      className="mt-1"
                    />
                    <div>
                      <Typography variant="subtitle1" className="font-medium">
                        {review.user?.displayName || review.user?.email}
                      </Typography>
                      <div className="flex items-center gap-2 mt-1">
                        <Rating value={review.rating} readOnly size="small" />
                        <Chip 
                          size="small" 
                          label={`Order #${review.order?.orderNumber}`}
                          className="bg-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(review.createdAt), 'MMM dd, yyyy - h:mm a')}
                  </Typography>
                </div>
                
                <Typography variant="body2" className="mt-3 text-gray-700">
                  {review.comment}
                </Typography>
                
                {review.isEdited && (
                  <Typography variant="caption" color="text.secondary" className="mt-2 italic block">
                    (Edited)
                  </Typography>
                )}
              </Box>
            ))}
          </div>
        ) : (
          <Box className="flex items-center justify-center h-[300px]">
            <Typography color="text.secondary">
              No reviews yet for this product
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions className="border-t p-4">
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductReviewModal;