import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import axios from "axios";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControlLabel, Switch,
  Grid, InputAdornment, Alert, Box, Typography,
  Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, FormHelperText,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from 'react-toastify';
import api from "@/utils/api";
import { auth } from "@/config/firebase.config";
import categoryApi from "@/api/categoryApi";

// Validation Schema
const ProductSchema = Yup.object().shape({
  name: Yup.string()
    .required('Product name is required')
    .min(3, 'Product name must be at least 3 characters'),
  price: Yup.number()
    .required('Price is required')
    .min(0, 'Price must be greater than 0')
    .typeError('Price must be a number'),
  description: Yup.string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters'),
  shortDescription: Yup.string()
    .max(150, 'Short description must not exceed 150 characters'),
  category: Yup.string()
    .required('Category is required'),
  stockQuantity: Yup.number()
    .min(0, 'Stock quantity cannot be negative')
    .integer('Stock quantity must be a whole number')
    .typeError('Stock quantity must be a number'),
  sku: Yup.string()
    .matches(/^[a-zA-Z0-9-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  compareAtPrice: Yup.number()
    .min(0, 'Compare at price must be greater than 0')
    .nullable()
    .typeError('Compare at price must be a number'),
  lowStockThreshold: Yup.number()
    .min(0, 'Threshold must be greater than 0')
    .integer('Threshold must be a whole number')
    .nullable()
    .typeError('Threshold must be a number'),
  subcategories: Yup.array()
    .of(Yup.string()),
  isActive: Yup.boolean(),
  isFeatured: Yup.boolean(),
  inStock: Yup.boolean(),
});

const initialFormState = {
  name: '',
  price: '',
  description: '',
  shortDescription: '',
  stockQuantity: 0,
  inStock: true,
  category: '',
  subcategories: [],
  isActive: true,
  isFeatured: false,
  sku: '',
  compareAtPrice: '',
  lowStockThreshold: '',
};

const ProductFormDialog = ({ open, product, onSave, handleClose }) => {
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [images, setImages] = useState({ files: [], previews: [] });

  useEffect(() => {
    const init = async () => {
      if (!open) return;

      try {
        const user = auth.currentUser;
        if (!user) {
          window.location.href = '/login';
          return;
        }

        const { data } = await categoryApi.getCategories();
        setCategories(data.data || []);

        if (product?.images?.length) {
          setImages(prev => ({
            ...prev,
            previews: product.images.map(img => ({
              url: img.url,
              id: img.publicId || img.id,
              isExisting: true
            }))
          }));
        }

        if (product?.category) {
          await fetchSubcategories(product.category._id || product.category);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Failed to initialize form');
      }
    };

    init();
  }, [open, product]);

  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) return;
    try {
      const { data } = await categoryApi.getSubcategoriesByCategory(categoryId);
      setSubcategories(data.data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories");
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    files.forEach(file => {
      if (file.size > maxSize || !allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file (max 5MB, JPG/PNG/WebP only)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({
          files: [...prev.files, file],
          previews: [...prev.previews, { url: reader.result }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => ({
      files: prev.files.filter((_, i) => i !== index),
      previews: prev.previews.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Authentication required');
      const token = await user.getIdToken(true);
  
      // Validate images
      if (images.files.length === 0 && !product?.images?.length) {
        setError('At least one product image is required');
        return;
      }
  
      // Format and validate values
      const formattedValues = {
        name: values.name.trim(),
        price: Number(values.price),
        description: values.description.trim(),
        shortDescription: values.shortDescription?.trim() || null,
        category: values.category.trim(),
        stockQuantity: Number(values.stockQuantity) || 0,
        sku: values.sku?.trim() || null,
        compareAtPrice: values.compareAtPrice ? Number(values.compareAtPrice) : null,
        lowStockThreshold: values.lowStockThreshold ? Number(values.lowStockThreshold) : null,
        subcategories: Array.isArray(values.subcategories) ? values.subcategories : [],
        isActive: Boolean(values.isActive),
        isFeatured: Boolean(values.isFeatured),
        inStock: Boolean(values.inStock)
      };
  
      // Validate compare price
      if (formattedValues.compareAtPrice && formattedValues.compareAtPrice <= formattedValues.price) {
        setFieldError('compareAtPrice', 'Compare price must be greater than regular price');
        return;
      }
  
      const formData = new FormData();
  
      // Append formatted values to formData
      Object.entries(formattedValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              value.forEach(item => formData.append(`${key}[]`, item));
            } else {
              formData.append(`${key}`, JSON.stringify([]));
            }
          } else if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value);
          }
        }
      });
  
      // Log formData for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
  
      // Handle images
      images.files.forEach(file => {
        formData.append('images', file);
      });
  
      // Handle existing images
      const existingImages = images.previews
        .filter(img => img.isExisting)
        .map(img => ({
          url: img.url,
          id: img.id || img.publicId
        }));
  
      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }
  
      // Make API request
      const response = product?._id
        ? await api.put(`/products/${product._id}`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            }
          })
        : await api.post('/products', formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            }
          });
  
      if (response.data.success) {
        toast.success(`Product ${product ? 'updated' : 'created'} successfully`);
        onSave?.(response.data.data);
        handleClose();
      }
    } catch (error) {
      console.error('Save error:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          if (err.field) {
            setFieldError(err.field, err.message);
          }
        });
      } else {
        const errorMessage = error.response?.data?.message || error.message;
        setError(errorMessage);
        toast.error(`Failed to ${product ? 'update' : 'create'} product: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box className="flex justify-between items-center">
          <Typography variant="h6">
            {product ? "Edit Product" : "Add New Product"}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Formik
        initialValues={product ? {
          name: product.name || '',
          price: product.price || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          stockQuantity: product.stockQuantity || 0,
          category: product.category?._id || product.category || '',
          subcategories: product.subcategories?.map(sub => sub._id || sub) || [],
          isActive: product.isActive ?? true,
          isFeatured: product.isFeatured || false,
          sku: product.sku || '',
          compareAtPrice: product.compareAtPrice || '',
          lowStockThreshold: product.lowStockThreshold || '',
          inStock: product.inStock ?? true,
        } : initialFormState}
        validationSchema={ProductSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
          <Form>
            <DialogContent dividers>
              {error && <Alert severity="error" className="mb-4">{error}</Alert>}
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box className="mb-4">
                    <Typography variant="subtitle2" className="mb-2">
                      Product Images
                      <Typography variant="caption" color="textSecondary" className="ml-2">
                        (Max 5MB per image, JPG/PNG/WebP)
                      </Typography>
                    </Typography>
                    <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.previews.map((image, index) => (
                        <Box key={index} className="relative">
                          <img
                            src={image.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <IconButton
                            size="small"
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => removeImage(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                        <CloudUploadIcon className="text-gray-400 mb-2" />
                        <Typography variant="caption" className="text-gray-500 text-center">
                          Upload Images
                        </Typography>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    name="name"
                    label="Product Name *"
                    fullWidth
                    error={touched.name && errors.name}
                    helperText={touched.name && errors.name}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    as={TextField}
                    name="price"
                    label="Regular Price *"
                    type="number"
                    fullWidth
                    error={touched.price && errors.price}
                    helperText={touched.price && errors.price}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: "0.01" }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    as={TextField}
                    name="compareAtPrice"
                    label="Compare at Price"
                    type="number"
                    fullWidth
                    error={touched.compareAtPrice && errors.compareAtPrice}
                    helperText={touched.compareAtPrice && errors.compareAtPrice}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: "0.01" }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl 
                    fullWidth 
                    error={touched.category && errors.category}
                  >
                    <InputLabel>Category *</InputLabel>
                    <Field
                      as={Select}
                      name="category"
                      label="Category *"
                      onChange={(e) => {
                        handleChange(e);
                        fetchSubcategories(e.target.value);
                        setFieldValue('subcategories', []);
                      }}
                    >
                      <MenuItem value="">Select a category</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.category && errors.category && (
                      <FormHelperText>{errors.category}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    as={TextField}
                    name="stockQuantity"
                    label="Stock Quantity"
                    type="number"
                    fullWidth
                    error={touched.stockQuantity && errors.stockQuantity}
                    helperText={touched.stockQuantity && errors.stockQuantity}
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box className="space-y-2">
                    <Typography variant="subtitle2">Subcategories</Typography>
                    <Box className="flex flex-wrap gap-2">
                      {subcategories.length > 0 ? (
                        subcategories.map((subcategory) => (
                          <Chip
                            key={subcategory._id}
                            label={subcategory.name}
                            onClick={() => {
                              const subcategoryId = subcategory._id;
                              const updatedSubcategories = values.subcategories.includes(subcategoryId)
                                ? values.subcategories.filter(id => id !== subcategoryId)
                                : [...values.subcategories, subcategoryId];
                              setFieldValue('subcategories', updatedSubcategories);
                            }}
                            color={values.subcategories.includes(subcategory._id) ? "primary" : "default"}
                            className="cursor-pointer"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          {values.category
                            ? "No subcategories available for this category"
                            : "Select a category first"}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    name="description"
                    label="Description *"
                    multiline
                    rows={4}
                    fullWidth
                    error={touched.description && errors.description}
                    helperText={touched.description && errors.description}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    name="shortDescription"
                    label="Short Description"
                    multiline
                    rows={2}
                    fullWidth
                    error={touched.shortDescription && errors.shortDescription}
                    helperText={touched.shortDescription && errors.shortDescription}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    as={TextField}
                    name="sku"
                    label="SKU"
                    fullWidth
                    error={touched.sku && errors.sku}
                    helperText={touched.sku && errors.sku}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    as={TextField}
                    name="lowStockThreshold"
                    label="Low Stock Threshold"
                    type="number"
                    fullWidth
                    error={touched.lowStockThreshold && errors.lowStockThreshold}
                    helperText={touched.lowStockThreshold && errors.lowStockThreshold}
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box className="flex flex-wrap gap-4">
                    <FormControlLabel
                      control={
                        <Field
                          as={Switch}
                          name="isActive"
                          color="primary"
                        />
                      }
                      label="Active"
                    />
                    <FormControlLabel
                      control={
                        <Field
                          as={Switch}
                          name="isFeatured"
                          color="primary"
                        />
                      }
                      label="Featured"
                    />
                    <FormControlLabel
                      control={
                        <Field
                          as={Switch}
                          name="inStock"
                          color="primary"
                        />
                      }
                      label="In Stock"
                    />
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Saving..." : product ? "Update Product" : "Create Product"}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ProductFormDialog;