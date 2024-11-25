// components/products/DeleteConfirm.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';

const DeleteConfirmDialog = ({ 
  open, 
  handleClose, 
  handleConfirm, 
  productName,
  isLoading 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={!isLoading ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="text-gray-800">
        Delete Product
      </DialogTitle>
      <DialogContent>
        <Typography className="text-gray-600">
          Are you sure you want to delete "{productName}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions className="p-4">
        <Button 
          onClick={handleClose}
          disabled={isLoading}
          className="text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          color="error" 
          variant="contained"
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;