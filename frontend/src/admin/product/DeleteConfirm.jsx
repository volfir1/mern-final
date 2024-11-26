// src/components/products/DeleteConfirmDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const DeleteConfirmDialog = ({ open, handleClose, handleConfirm, productName }) => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>Delete Product</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete "{productName}"? This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>Cancel</Button>
      <Button onClick={handleConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteConfirmDialog;