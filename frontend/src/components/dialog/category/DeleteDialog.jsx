// src/components/dialog/category/DeleteDialog.jsx
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const DeleteDialog = memo(({
  open = false,
  onClose,
  onConfirm,
  itemName = '',
  type = 'category',
  isLoading = false,
  parentCategoryName = '' // Moved from defaultProps to parameter defaults
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getDialogTitle = () => {
    if (type === 'subcategory') {
      return 'Delete Subcategory';
    }
    return 'Delete Category';
  };

  const getConfirmationMessage = () => {
    if (type === 'subcategory') {
      return (
        <>
          Are you sure you want to delete the subcategory {'"'}
          <span className="font-medium">{itemName}</span>
          {'"'}
          {parentCategoryName && (
            <> from category {'"'}<span className="font-medium">{parentCategoryName}</span>{'"'}</>
          )}?
        </>
      );
    }
    return (
      <>
        Are you sure you want to delete the category {'"'}
        <span className="font-medium">{itemName}</span>
        {'"'}?
      </>
    );
  };

  return (
    <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
  >
    <DialogTitle component="div" className="flex items-center gap-2">
      <WarningIcon className="text-red-500" />
      <Typography
        component="h2"
        variant="h6"
      >
        {getDialogTitle()}
      </Typography>
    </DialogTitle>

    <DialogContent>
      <Typography component="div" className="mb-2">
        {getConfirmationMessage()} This action cannot be undone.
      </Typography>
      
      {type !== 'subcategory' && (
        <Typography
          component="div"
          className="mt-2 text-red-500 bg-red-50 p-3 rounded-md border border-red-200"
        >
          Warning: This will also delete all subcategories associated with this category.
        </Typography>
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
        onClick={handleConfirm}
        disabled={isLoading}
        color="error"
        variant="contained"
        startIcon={isLoading ? <CircularProgress size={20} /> : null}
      >
        {isLoading ? 'Deleting...' : `Delete ${type === 'subcategory' ? '' : ''}`}
      </Button>
    </DialogActions>
  </Dialog>
  );
});

DeleteDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  itemName: PropTypes.string,
  type: PropTypes.oneOf(['category', 'subcategory']),
  isLoading: PropTypes.bool,
  parentCategoryName: PropTypes.string
};


DeleteDialog.defaultProps = {
  isLoading: false,
  type: 'category',
  itemName: '',
  parentCategoryName: ''
};

DeleteDialog.displayName = 'DeleteDialog';

export default DeleteDialog;