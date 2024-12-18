import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  InputAdornment,
  Alert
} from '@mui/material';
import axios from 'axios';
import api from '@/utils/api';
import { auth } from '@/config/firebase.config';
 
const ProductFormDialog = ({ open, handleClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    compareAtPrice: '',
    description: '',
    shortDescription: '',
    stockQuantity: 0,
    sku: '',
    isActive: true,
    isFeatured: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        compareAtPrice: product.compareAtPrice || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        stockQuantity: product.stockQuantity || 0,
        sku: product.sku || '',
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false
      });
    } else {
      setFormData({
        name: '',
        price: '',
        compareAtPrice: '',
        description: '',
        shortDescription: '',
        stockQuantity: 0,
        sku: '',
        isActive: true,
        isFeatured: false
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      const formDataToSend = new FormData();
      
      // Append basic fields
      Object.keys(formData).forEach(key => {
        if (key !== 'images') {
          formDataToSend.append(key, formData[key]);
        }
      });
  
      // Handle images
      imageFiles.forEach((file) => {
        formDataToSend.append('image', file);
      });
  
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
  
      let response;
      if (product?._id) {
        // Update existing product
        response = await api.put(`/api/products/${product._id}`, formDataToSend, config);
      } else {
        // Create new product
        response = await api.post('/api/products', formDataToSend, config);
      }
  
      if (response.data.success) {
        toast.success(product ? 'Product updated successfully' : 'Product created successfully');
        onSave(response.data.data);
        handleClose();
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Product save error:', err);
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {product ? 'Edit Product' : 'Add New Product'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Product Name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                error={Boolean(formData.name && formData.name.length < 3)}
                helperText={
                  formData.name && formData.name.length < 3
                    ? 'Name must be at least 3 characters'
                    : ''
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="compareAtPrice"
                label="Compare at Price"
                type="number"
                value={formData.compareAtPrice}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="shortDescription"
                label="Short Description"
                value={formData.shortDescription}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="stockQuantity"
                label="Stock Quantity"
                type="number"
                value={formData.stockQuantity}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="sku"
                label="SKU"
                value={formData.sku}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange}
                    name="isActive"
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    name="isFeatured"
                  />
                }
                label="Featured"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductFormDialog;