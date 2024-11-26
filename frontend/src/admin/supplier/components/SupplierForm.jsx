import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
  Typography,
  CircularProgress,
  Box,
  Paper,
  Divider,
  Alert,
  Zoom,
  Tooltip,
  Switch,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  LocationCity as LocationCityIcon,
  Place,
  Public as PublicIcon,
  Lock as LockIcon,
  PhotoCamera as CameraIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  ToggleOn as ActiveIcon,
} from '@mui/icons-material';
import CountrySelect from '@/components/dialog/supplier/CountrySelect';

const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

const SupplierForm = ({
  open,
  onClose,
  formData = {
    name: '',
    email: '',
    phone: '',
    description: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    status: 'active'
  },
  formErrors = {},
  submitting = false,
  selectedSupplier = null,
  handleFormChange,
  handleSubmit: onSubmit,
  handleImageChange: onImageChange,
  handleImageDelete: onImageDelete,
  imagePreview = null
}) => {
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState(null);

  // Add this to debug
  useEffect(() => {
    console.log('Form Data Status:', formData.status);
  }, [formData.status]);

  // Handle country selection
  const handleCountrySelect = useCallback((country) => {
    handleFormChange({
      target: {
        name: 'country',
        value: country.name,
        countryData: {
          code: country.code,
          flag: country.flag,
          currency: country.currency,
          phone: country.phone
        }
      }
    });
    setCountryDialogOpen(false);
  }, [handleFormChange]);

  // Handle image change with validation
  const handleLocalImageChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      handleFormChange({
        target: {
          name: 'imageError',
          value: 'Please upload a valid image file (JPEG, PNG, or GIF)'
        }
      });
      return;
    }

    // Validate file size
    if (file.size > IMAGE_SIZE_LIMIT) {
      handleFormChange({
        target: {
          name: 'imageError',
          value: 'Image size should be less than 5MB'
        }
      });
      return;
    }

    // Create preview and pass to parent
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageChange({
        target: {
          name: 'image',
          value: file,
          preview: reader.result
        }
      });
    };
    reader.readAsDataURL(file);
  }, [onImageChange, handleFormChange]);

  // Handle image delete
  const handleLocalImageDelete = useCallback(() => {
    setCurrentImageFile(null);
    onImageDelete();
  }, [onImageDelete]);

  // Handle form submission
  const handleLocalSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(e, { ...formData, image: currentImageFile });
  }, [formData, currentImageFile, onSubmit]);

  // Reusable TextField component
  const renderTextField = useCallback((props) => (
    <TextField
      fullWidth
      variant="outlined"
      disabled={submitting}
      {...props}
      className={`transition-all duration-200 ${
        !props.error && 'hover:shadow-sm'
      }`}
    />
  ), [submitting]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: "min-h-[80vh]"
      }}
      TransitionComponent={Zoom}
      transitionDuration={300}
    >
      <form onSubmit={handleLocalSubmit} noValidate>
        {/* Dialog Header */}
        <DialogTitle className="p-0">
          <Box className="flex justify-between items-center p-4">
            <Typography variant="h6" className="font-medium flex items-center">
              {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              <Tooltip title="Add a new supplier to your system" arrow>
                <InfoIcon className="ml-2 text-gray-400 w-5 h-5" />
              </Tooltip>
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              className="text-gray-500 hover:text-gray-700"
              disabled={submitting}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
        </DialogTitle>

        <DialogContent className="p-6 space-y-8">
          {/* Form Error Alert */}
          {formErrors.submit && (
            <Alert 
              severity="error" 
              className="mb-4"
              onClose={() => handleFormChange({ 
                target: { name: 'submit', value: '' }
              })}
            >
              {formErrors.submit}
            </Alert>
          )}

          {/* Image Upload */}
          <Paper className="p-6 text-center transition-all hover:shadow-md">
            <input
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              id="supplier-image"
              className="hidden"
              onChange={handleLocalImageChange}
              disabled={submitting}
            />
            <Box className="relative mx-auto mb-4">
              <div className="w-32 h-32">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Supplier"
                      className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-lg"
                    />
                    <IconButton
                      className="absolute -top-2 -right-2 bg-red-50 hover:bg-red-100"
                      size="small"
                      onClick={handleLocalImageDelete}
                      disabled={submitting}
                    >
                      <DeleteIcon className="text-red-500" fontSize="small" />
                    </IconButton>
                  </div>
                ) : (
                  <label
                    htmlFor="supplier-image"
                    className="flex items-center justify-center w-full h-full rounded-full border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-all duration-300 bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="text-center">
                      <CameraIcon className="text-gray-400 w-8 h-8 mb-1" />
                      <span className="text-gray-500 text-sm block">
                        Upload Logo
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </Box>
            {formErrors.image && (
              <Typography color="error" variant="caption" display="block" className="mt-1">
                {formErrors.image}
              </Typography>
            )}
            <Typography variant="caption" color="textSecondary" className="mt-2 block">
              {imagePreview ? 'Click to change company logo' : 'Upload company logo (JPEG, PNG, GIF, max 5MB)'}
            </Typography>
          </Paper>

          {/* Basic Information */}
          <Box>
            <Typography variant="h6" className="mb-4 font-medium flex items-center">
              <BusinessIcon className="mr-2 text-blue-500" />
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderTextField({
                  required: true,
                  label: "Company Name",
                  name: "name",
                  value: formData.name,
                  onChange: handleFormChange,
                  error: !!formErrors.name,
                  helperText: formErrors.name,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }
                })}
              </Grid>

              <Grid item xs={12} md={6}>
                {renderTextField({
                  required: true,
                  label: "Email Address",
                  name: "email",
                  type: "email",
                  value: formData.email,
                  onChange: handleFormChange,
                  error: !!formErrors.email,
                  helperText: formErrors.email,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }
                })}
              </Grid>

              <Grid item xs={12} md={6}>
                {renderTextField({
                  required: true,
                  label: "Phone Number",
                  name: "phone",
                  value: formData.phone,
                  onChange: handleFormChange,
                  error: !!formErrors.phone,
                  helperText: formErrors.phone,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }
                })}
              </Grid>

              <Grid item xs={12}>
                {renderTextField({
                  multiline: true,
                  rows: 4,
                  label: "Description",
                  name: "description",
                  value: formData.description,
                  onChange: handleFormChange,
                  error: !!formErrors.description,
                  helperText: formErrors.description,
                  placeholder: "Enter company description..."
                })}
              </Grid>

              <Grid item xs={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.status === 'active'}
                        onChange={(e) => handleFormChange({
                          target: {
                            name: 'status',
                            value: e.target.checked ? 'active' : 'inactive'
                          }
                        })}
                        disabled={submitting}
                        color="success"
                      />
                    }
                    label={
                      <Box className="flex items-center">
                        <ActiveIcon 
                          className={`mr-2 ${
                            formData.status === 'active' 
                              ? 'text-green-500' 
                              : 'text-gray-400'
                          }`}
                        />
                        <Typography>
                          Status: {formData.status === 'active' ? 'Active' : 'Inactive'}
                        </Typography>
                      </Box>
                    }
                  />
                </FormGroup>
                {formErrors.status && (
                  <Typography color="error" variant="caption">
                    {formErrors.status}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Address Information */}
          <Box>
            <Typography variant="h6" className="mb-4 font-medium flex items-center">
              <HomeIcon className="mr-2 text-blue-500" />
              Address Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderTextField({
                  required: true,
                  label: "Street Address",
                  name: "street",
                  value: formData.street,
                  onChange: handleFormChange,
                  error: !!formErrors.street,
                  helperText: formErrors.street,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }
                })}
              </Grid>

              <Grid item xs={12} md={6}>
                {renderTextField({
                  required: true,
                  label: "City",
                  name: "city",
                  value: formData.city,
                  onChange: handleFormChange,
                  error: !!formErrors.city,
                  helperText: formErrors.city,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }
                })}
              </Grid>

              <Grid item xs={12} md={6}>
                {renderTextField({
                  required: true,
                  label: "State/Province",
                  name: "state",
                  value: formData.state,
                  onChange: handleFormChange,
                  error: !!formErrors.state,
                  helperText: formErrors.state,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Place className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }
                })}
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Country"
                  name="country"
                  value={formData.country}
                  onClick={() => !submitting && setCountryDialogOpen(true)}
                  error={!!formErrors.country}
                  helperText={formErrors.country}
                  disabled={submitting}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        {formData.countryData?.flag ? (
                          <span className="text-xl mr-1">{formData.countryData.flag}</span>
                        ) : (
                          <PublicIcon className="text-gray-400" />
                        )}
                      </InputAdornment>
                    ),
                  }}
                  className="cursor-pointer transition-all hover:shadow-sm"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                {renderTextField({
                  required: true,
                  label: "ZIP/Postal Code",
                  name: "zipCode",
                  value: formData.zipCode,
                  onChange: handleFormChange,
                  error: !!formErrors.zipCode,
                  helperText: formErrors.zipCode,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }
                })}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions className="p-4">
          <Button
            onClick={onClose}
            disabled={submitting}
            color="inherit"
            className="hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting 
              ? 'Saving...' 
              : selectedSupplier 
                ? 'Update Supplier' 
                : 'Create Supplier'
            }
          </Button>
        </DialogActions>
      </form>

      <CountrySelect
        open={countryDialogOpen}
        onClose={() => setCountryDialogOpen(false)}
        onSelect={handleCountrySelect}
        selectedCountry={formData.country}
      />
    </Dialog>
  );
};

SupplierForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    description: PropTypes.string,
    street: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    country: PropTypes.string,
    zipCode: PropTypes.string,
    status: PropTypes.oneOf(['active', 'inactive']).isRequired, // Made status required
    countryData: PropTypes.shape({
      code: PropTypes.string,
      flag: PropTypes.string,
      currency: PropTypes.string,
      phone: PropTypes.string
    }),
  }),
  formErrors: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    description: PropTypes.string,
    street: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    country: PropTypes.string,
    zipCode: PropTypes.string,
    image: PropTypes.string,
    submit: PropTypes.string,
    status: PropTypes.string, // Added status error
  }),
  submitting: PropTypes.bool,
  selectedSupplier: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    description: PropTypes.string,
    street: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    country: PropTypes.string,
    zipCode: PropTypes.string,
    status: PropTypes.string,
    image: PropTypes.string,
    countryData: PropTypes.shape({
      code: PropTypes.string,
      flag: PropTypes.string,
      currency: PropTypes.string,
      phone: PropTypes.string
    })
  }),
  handleFormChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleImageChange: PropTypes.func.isRequired,
  handleImageDelete: PropTypes.func.isRequired,
  imagePreview: PropTypes.string
};

export default React.memo(SupplierForm);
