// src/components/dialog/category/CreateDialog.jsx
import React, { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';

const CreateDialog = memo(({
  open = false,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    if (formData.image) {
      submitData.append('image', formData.image);
    }

    try {
      await onSubmit({
        formData: submitData,
        type: 'category'
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        image: null
      });
      setImagePreview('');
    } catch (error) {
      console.error('Submit error:', error);
    }
  }, [formData, onSubmit]);

  const handleClose = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      image: null
    });
    setImagePreview('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "rounded-lg"
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h6" className="font-semibold">
            Create New Category
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <div className="space-y-4">
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              required
              className="mt-2"
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              disabled={isLoading}
            />

            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
                className="hidden"
                id="image-upload"
              />
              <label 
                htmlFor="image-upload"
                className="block"
              >
                <Button
                  component="span"
                  variant="outlined"
                  disabled={isLoading}
                  fullWidth
                >
                  Upload Image
                </Button>
              </label>
              {imagePreview && (
                <div className="mt-2 relative w-full h-48">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>

        <DialogActions className="p-4">
          <Button
            onClick={handleClose}
            disabled={isLoading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? (
              <CircularProgress size={24} className="text-white" />
            ) : (
              'Create Category'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
});

CreateDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

CreateDialog.displayName = 'CreateDialog';

export default CreateDialog;  