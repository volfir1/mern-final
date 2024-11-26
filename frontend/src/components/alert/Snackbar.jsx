// src/components/alert/Snackbar.jsx
import React, { useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

const SnackbarMessage = ({ 
  open, 
  onClose, 
  message, 
  severity = 'success',
  onExited,  // Called when snackbar exit animation is completed
  autoHideDuration = 2000  // Reduced to 2 seconds for faster navigation
}) => {
  useEffect(() => {
    if (!open && onExited) {
      onExited();
    }
  }, [open, onExited]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionProps={{
        onExited: onExited  // This will be called after the Snackbar closes
      }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarMessage;