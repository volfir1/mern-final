import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button,
  Typography,
  CircularProgress 
} from "@mui/material";
import { Warning as WarningIcon } from '@mui/icons-material';

const DeleteConfirmationDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  type = 'category',  // 'category' or 'subcategory'
  itemName = '',      // Name of the item being deleted
  isLoading = false   // Loading state while deleting
}) => {
  const itemType = type === 'subcategory' ? 'Subcategory' : 'Category';
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="flex items-center gap-2">
        <WarningIcon className="text-red-500" />
        <Typography variant="h6" component="span">
          Delete {itemType}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText className="mb-4">
          Are you sure you want to delete {itemName ? `"${itemName}"` : `this ${itemType.toLowerCase()}`}? 
          This action cannot be undone.
        </DialogContentText>

        {type === 'category' && (
          <DialogContentText className="text-red-500 mt-2">
            Warning: This will also delete all subcategories associated with this category.
          </DialogContentText>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={isLoading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;