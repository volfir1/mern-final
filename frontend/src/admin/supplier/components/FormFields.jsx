import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Grid,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  LocationCity as LocationCityIcon,
  Place as PlaceIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import CountrySelect from '@/components/dialog/supplier/CountrySelect';

const SupplierFormFields = ({ 
  formData, 
  validation, 
  onChange, 
}) => {
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);

  const handleCountrySelect = (country) => {
    onChange({
      target: {
        name: 'address.country',
        value: country.name,
        // Store additional country data
        countryData: {
          code: country.code,
          flag: country.flag,
          currency: country.currency,
          phoneCode: country.phone
        }
      }
    });
    setCountryDialogOpen(false);
  };

  return (
    <Box>
      {/* Basic Information Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Basic Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Company Name *"
              name="name"
              value={formData.name}
              onChange={onChange}
              error={!!validation.name}
              helperText={validation.name}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Address *"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              error={!!validation.email}
              helperText={validation.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number *"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              error={!!validation.phone}
              helperText={validation.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              name="description"
              value={formData.description}
              onChange={onChange}
              error={!!validation.description}
              helperText={validation.description}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Address Information Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Address Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address *"
              name="address.street"
              value={formData.address.street}
              onChange={onChange}
              error={!!validation['address.street']}
              helperText={validation['address.street']}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HomeIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="City *"
              name="address.city"
              value={formData.address.city}
              onChange={onChange}
              error={!!validation['address.city']}
              helperText={validation['address.city']}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationCityIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="State/Province *"
              name="address.state"
              value={formData.address.state}
              onChange={onChange}
              error={!!validation['address.state']}
              helperText={validation['address.state']}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PlaceIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Country *"
              name="address.country"
              value={formData.address.country}
              onClick={() => setCountryDialogOpen(true)}
              error={!!validation['address.country']}
              helperText={validation['address.country']}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    {formData.address.countryData?.flag ? (
                      <span className="text-xl mr-1">
                        {formData.address.countryData.flag}
                      </span>
                    ) : (
                      <PublicIcon />
                    )}
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <PublicIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ZIP/Postal Code *"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={onChange}
              error={!!validation['address.zipCode']}
              helperText={validation['address.zipCode']}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Country Select Dialog */}
      <CountrySelect
        open={countryDialogOpen}
        onClose={() => setCountryDialogOpen(false)}
        onSelect={handleCountrySelect}
        selectedCountry={formData.address.country}
      />
    </Box>
  );
};

SupplierFormFields.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    description: PropTypes.string,
    address: PropTypes.shape({
      street: PropTypes.string.isRequired,
      city: PropTypes.string.isRequired,
      state: PropTypes.string.isRequired,
      country: PropTypes.string.isRequired,
      zipCode: PropTypes.string.isRequired,
      countryData: PropTypes.shape({
        code: PropTypes.string,
        flag: PropTypes.string,
        currency: PropTypes.string,
        phone: PropTypes.string
      })
    }).isRequired
  }).isRequired,
  validation: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default SupplierFormFields;