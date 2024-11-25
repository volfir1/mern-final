import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

const InputDialog = ({ open, onClose, title, onSubmit, submitText = "Submit" }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {/* Add Input fields */}
        <TextField label="Input 1" fullWidth className="mb-4" />
        <TextField label="Input 2" fullWidth className="mb-4" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary">
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InputDialog;
