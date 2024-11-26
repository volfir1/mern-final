// src/components/dialog/category/EditDialog.jsx
import React, { useState, useEffect, memo, useCallback } from 'react';
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
import { Image as ImageIcon } from '@mui/icons-material';

const EditDialog = memo(({
  open = false,
  onClose,
  onSubmit,
  item = null,
  type = 'category',
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        image: null
      });
      setImagePreview(item.image?.url || '');
    }
  }, [item]);

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
      
      // Create image preview
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
      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit error:', error);
    }
  }, [formData, onSubmit]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle component="div">
          <Typography 
            component="h2" 
            variant="h6"
          >
            Edit {type === 'subcategory' ? 'Subcategory' : 'Category'}
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
                id="image-upload-edit"
              />
              <label 
                htmlFor="image-upload-edit"
                className="block"
              >
                <Button
                  component="span"
                  variant="outlined"
                  color="primary"
                  disabled={isLoading}
                  fullWidth
                >
                  Change Image
                </Button>
              </label>

              <div className="mt-2 relative w-full h-48 bg-gray-100 rounded">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
});

EditDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  item: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.shape({
      url: PropTypes.string
    })
  }),
  type: PropTypes.oneOf(['category', 'subcategory']),
  isLoading: PropTypes.bool
};


EditDialog.displayName = 'EditDialog';

export default EditDialog;