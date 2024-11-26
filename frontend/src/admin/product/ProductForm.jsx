// src/components/dialog/ProductDialog.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Alert,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from 'react-toastify';


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
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({
            name: product.name || '',
            price: product.price || '',
            description: product.description || '',
            shortDescription: product.shortDescription || '',
            stockQuantity: product.stockQuantity || product.stock || 0,
            category: product.category?._id || product.category || '',
            subcategories: product.subcategories?.map(sub => sub._id || sub) || [],
            isActive: product.isActive ?? true,
            isFeatured: product.isFeatured || false,
            sku: product.sku || '',
            compareAtPrice: product.compareAtPrice || '',
            lowStockThreshold: product.lowStockThreshold || '',
            inStock: product.inStock || false
        });

        if (product.images?.length) {
                setImagePreviews(product.images.map(img => ({
                    url: img.url,
                    id: img.publicId || img.id,
                    isExisting: true
                })));
            }
      } else {
        // Reset form for new product
        setFormData(initialFormState);
        setImageFiles([]);
        setImagePreviews([]);
      }
      fetchCategories();
    }
  }, [open, product]);

  useEffect(() => {
    if (formData.category) {
      fetchSubcategories(formData.category);
    } else {
      setSubcategories([]);
    }
  }, [formData.category]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories");
      const categoriesData = response.data.data || response.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
      setCategories([]);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await axios.get(
        `/api/subcategories/category/${categoryId}`
      );
      const subcategoriesData = response.data.data || response.data;
      setSubcategories(
        Array.isArray(subcategoriesData) ? subcategoriesData : []
      );
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setSubcategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        category: value,
        subcategories: [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== files.length) {
      setError("Some files were skipped. Only images under 5MB are allowed.");
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [
          ...prev,
          {
            url: reader.result,
            file,
            isExisting: false,
          },
        ]);
      };
      reader.readAsDataURL(file);
      setImageFiles((prev) => [...prev, file]);
    });
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Update the image handling part in handleSubmit
 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
        const formDataToSend = new FormData();

        // Convert prices to numbers for proper comparison
        const regularPrice = Number(formData.price);
        const comparePrice = formData.compareAtPrice ? Number(formData.compareAtPrice) : null;
        const stockQuantity = Number(formData.stockQuantity) || 0;
        const inStock = stockQuantity > 0;

        // Validate compare price
        if (comparePrice !== null && comparePrice <= regularPrice) {  // Using <= here
          setError("Compare at price must be greater than regular price");
          setLoading(false);
          return;
      }

        // For update: check if we need to exclude name check for current product
        if (product?._id) {
            formDataToSend.append("productId", product._id);
        }

        // Append basic fields with proper type conversion
        formDataToSend.append("name", formData.name.trim());
        formDataToSend.append("price", regularPrice);
        formDataToSend.append("category", formData.category);
        formDataToSend.append("description", formData.description.trim());
        formDataToSend.append("stockQuantity", stockQuantity);
        formDataToSend.append("inStock", inStock);
        formDataToSend.append("stock", stockQuantity);

        // Optional fields with null/undefined checks
        if (formData.shortDescription?.trim()) {
            formDataToSend.append("shortDescription", formData.shortDescription.trim());
        }

        // Only append compareAtPrice if it's valid and greater than regular price
        if (comparePrice !== null && comparePrice > regularPrice) {
            formDataToSend.append("compareAtPrice", comparePrice);
        }

        formDataToSend.append("isActive", Boolean(formData.isActive));
        formDataToSend.append("isFeatured", Boolean(formData.isFeatured));

        if (formData.sku?.trim()) {
            formDataToSend.append("sku", formData.sku.trim());
        }

        // Handle subcategories
        if (formData.subcategories?.length > 0) {
            formData.subcategories.forEach((subId) => {
                formDataToSend.append("subcategories", subId);
            });
        }

        // Handle image uploads
        if (imageFiles.length > 0) {
            imageFiles.forEach((file) => {
                formDataToSend.append("image", file);
            });
        }

        // For update: handle existing images
        if (product && imagePreviews) {
            const existingImages = imagePreviews
                .filter(img => img.isExisting)
                .map(img => ({
                    url: img.url,
                    publicId: img.id
                }));
            
            if (existingImages.length > 0) {
                formDataToSend.append("existingImages", JSON.stringify(existingImages));
            }
        }

        // Log the values being sent for debugging
        console.log('Sending prices:', {
            regularPrice,
            comparePrice,
            isUpdate: !!product
        });

        const url = product ? `/api/products/${product._id}` : "/api/products";
        const response = await axios({
            method: product ? "put" : "post",
            url,
            data: formDataToSend,
            headers: { 
                "Content-Type": "multipart/form-data"
            },
            validateStatus: function (status) {
                return status >= 200 && status < 500;
            }
        });

        // Handle the response
        if (!response.data.success) {
            const errorMessage = response.data.errors 
                ? Array.isArray(response.data.errors) 
                    ? response.data.errors.join(", ")
                    : response.data.errors
                : response.data.message || 'Operation failed';
            
            setError(errorMessage);
            return;
        }

        setError('');
        if (onSave) {
            onSave(response.data);
        }
        handleClose();

    } catch (err) {
        console.error("Submission error:", err);
        
        const errorMessage = err.response?.data?.errors
            ? Array.isArray(err.response.data.errors)
                ? err.response.data.errors.join(", ")
                : err.response.data.errors
            : err.response?.data?.message
                || err.message
                || `Failed to ${product ? 'update' : 'create'} product`;
        
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
};



  return (
    <Dialog
      open={open}
      onClose={handleClose} // Update here
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box className="flex justify-between items-center">
          <Typography>
            {product ? "Edit Product" : "Add New Product"}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            {" "}
            {/* Update here */}
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Image Upload */}
            <Grid item xs={12}>
              <Box className="mb-4">
                <Typography variant="subtitle2" className="mb-2">
                  Product Images
                </Typography>
                <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((image, index) => (
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
                    <Typography variant="caption" className="text-gray-500">
                      Upload Images
                    </Typography>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </Box>
              </Box>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Product Name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
            <TextField
    name="price"
    label="Regular Price *"
    type="number"
    value={formData.price}
    onChange={handleChange}
    fullWidth
    required
    inputProps={{
        min: 0,
        step: "0.01"
    }}
    InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
    }}
/>
            </Grid>

            <Grid item xs={12} md={6}>
            <TextField
    name="compareAtPrice"
    label="Compare at Price (Original Price)"
    type="number"
    value={formData.compareAtPrice}
    onChange={handleChange}
    fullWidth
    inputProps={{
        min: 0,
        step: "0.01"
    }}
    InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
    }}
    error={Boolean(formData.compareAtPrice && Number(formData.compareAtPrice) <= Number(formData.price))}
    helperText={
        formData.compareAtPrice && Number(formData.compareAtPrice) <= Number(formData.price)
            ? "Compare at price must be greater than regular price"
            : ""
    }
/>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  <MenuItem value="">Select a category</MenuItem>
                  {categories?.length > 0 ? (
                    categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No categories available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box className="space-y-2">
                <Typography variant="subtitle2">Subcategories</Typography>
                <Box className="flex flex-wrap gap-2">
                  {subcategories?.length > 0 ? (
                    subcategories.map((subcategory) => (
                      <Chip
                        key={subcategory._id}
                        label={subcategory.name}
                        onClick={() => {
                          const subcategoryId = subcategory._id;
                          setFormData((prev) => ({
                            ...prev,
                            subcategories: prev.subcategories.includes(
                              subcategoryId
                            )
                              ? prev.subcategories.filter(
                                  (id) => id !== subcategoryId
                                )
                              : [...prev.subcategories, subcategoryId],
                          }));
                        }}
                        color={
                          formData.subcategories.includes(subcategory._id)
                            ? "primary"
                            : "default"
                        }
                        className="cursor-pointer"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      {formData.category
                        ? "No subcategories available"
                        : "Select a category first"}
                    </Typography>
                  )}
                </Box>
              </Box>
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

            <Grid item xs={12} md={6}>
    <TextField
        name="stockQuantity"
        label="Stock Quantity"
        type="number"
        value={formData.stockQuantity}
        onChange={handleChange}
        fullWidth
        InputProps={{
            inputProps: { min: 0 }
        }}
    />
</Grid>

<Grid item xs={12} md={6}>
    <TextField
        name="lowStockThreshold"
        label="Low Stock Threshold"
        type="number"
        value={formData.lowStockThreshold}
        onChange={handleChange}
        fullWidth
        InputProps={{
            inputProps: { min: 0 }
        }}
    />
</Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="sku"
                label="SKU"
                value={formData.sku}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <Box className="flex gap-4">
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
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            {" "}
            {/* Update here */}
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductFormDialog;
