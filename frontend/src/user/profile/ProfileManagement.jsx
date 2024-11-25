// ProfileManagement.jsx - Part 1: Imports and State Setup
import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  InputAdornment, 
  Grid, 
  IconButton, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  AlertTitle,
  Card,
  CardContent,
} from '@mui/material';
import {
  Home,
  Work,
  LocationOn,
  Phone,
  Edit,
  Save,
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { TokenManager } from "../../utils/tokenManager";
import api from "@/utils/api";

const ProfileManagement = () => {
  // State Management
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    image: { url: '' },
    primaryAddress: null,
    additionalAddresses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: '',
    label: 'Home',
    contactPerson: '',
    contactNumber: ''
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/me');
        if (response.data.success) {
          setProfile(response.data.profile);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
}, []);


  //Event Handlers

// Update Profile handler
const handleProfileUpdate = async (e) => {
  e.preventDefault();
  try {
    const response = await api.put('/profile/me', {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone
    });
    
    if (response.data.success) {
      setProfile(response.data.profile);
      setEditMode(false);
    } else {
      setError(response.data.message);
    }
  } catch (err) {
    console.error('Profile update error:', err);
    setError('Failed to update profile');
  }
};




const handleAddressSubmit = async (e) => {
  e.preventDefault();
  try {
      // First verify auth
      const token = await TokenManager.getToken(true); // Force refresh token
      if (!token) {
          console.error('No token available');
          setError('Please log in to continue');
          return;
      }

      console.log('Making request with token present');

      // Validate the form data before submission
      if (!newAddress.street || !newAddress.barangay || !newAddress.city || 
          !newAddress.province || !newAddress.postalCode || !newAddress.label ||
          !newAddress.contactPerson || !newAddress.contactNumber) {
          setError('Please fill in all required fields');
          return;
      }

      // Validate phone number format
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(newAddress.contactNumber)) {
          setError('Please enter a valid Philippine mobile number (e.g., 09123456789)');
          return;
      }

      // Clean the data before sending
      const cleanedAddress = {
          ...newAddress,
          street: newAddress.street.trim(),
          barangay: newAddress.barangay.trim(),
          city: newAddress.city.trim(),
          province: newAddress.province.trim(),
          postalCode: newAddress.postalCode.trim(),
          contactPerson: newAddress.contactPerson.trim(),
          contactNumber: newAddress.contactNumber.replace(/\s+/g, '') // Remove any whitespace
      };

      console.log('Sending address data:', cleanedAddress);

      const response = await api.post('/profile/address', cleanedAddress);
      
      if (response.data.success) {
          console.log('Address added successfully:', response.data);
          
          // Update the profile state with new data
          setProfile(prev => ({
              ...prev,
              primaryAddress: response.data.profile.primaryAddress,
              additionalAddresses: response.data.profile.additionalAddresses
          }));

          // Reset the form
          setNewAddress({
              street: '',
              barangay: '',
              city: '',
              province: '',
              postalCode: '',
              label: 'Home',
              contactPerson: '',
              contactNumber: ''
          });

          // Close the form
          setShowAddressForm(false);

          // Optional: Show success message
          setError(''); // Clear any existing errors
      } else {
          console.error('Server responded with error:', response.data.message);
          setError(response.data.message || 'Failed to add address');
      }
  } catch (err) {
      console.error('Full error:', err);
      
      // Enhanced error handling
      if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Response error data:', err.response.data);
          console.error('Response error status:', err.response.status);
          console.error('Response error headers:', err.response.headers);
          
          setError(err.response.data?.message || 
                  err.response.data?.error || 
                  'Failed to add address. Please try again.');
      } else if (err.request) {
          // The request was made but no response was received
          console.error('Request error:', err.request);
          setError('No response received from server. Please check your connection.');
      } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', err.message);
          setError('An error occurred while processing your request.');
      }

      // Log the complete error for debugging
      console.error('Complete error object:', {
          message: err.message,
          stack: err.stack,
          config: err.config
      });
  }
};
const handleSetPrimaryAddress = async (addressId) => {
  try {
    const response = await api.put(`/profile/address/${addressId}/primary`);
    
    if (response.data.success) {
      setProfile(prev => ({
        ...prev,
        primaryAddress: response.data.data.primaryAddress,
        additionalAddresses: response.data.data.additionalAddresses
      }));
    }
  } catch (err) {
    console.error('Set primary address error:', err);
    setError('Failed to set primary address');
  }
};


const handleDeleteAddress = async (addressId) => {
  try {
    const response = await api.delete(`/profile/address/${addressId}`);
    
    if (response.data.success) {
      setProfile(prev => ({
        ...prev,
        additionalAddresses: prev.additionalAddresses.filter(addr => addr._id !== addressId)
      }));
    }
  } catch (err) {
    console.error('Delete address error:', err);
    setError('Failed to delete address');
  }
};

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </Box>
    );
  }

  //Render
  return (
    <Box className="max-w-4xl mx-auto p-4 space-y-6">
      {error && (
        <Alert severity="error" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Profile Information Section */}
      <Paper elevation={2} className="p-6">
        <Box className="flex justify-between items-center mb-6">
          <div>
            <Typography variant="h5" component="h2" className="font-bold">
              Profile Information
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your personal information
            </Typography>
          </div>
          <IconButton 
            onClick={() => setEditMode(!editMode)}
            color="primary"
            className="hover:bg-blue-50"
          >
            {editMode ? <Save /> : <Edit />}
          </IconButton>
        </Box>

        <form onSubmit={handleProfileUpdate}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profile.firstName}
                onChange={e => setProfile({...profile, firstName: e.target.value})}
                disabled={!editMode}
                variant="outlined"
                className="bg-white"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profile.lastName}
                onChange={e => setProfile({...profile, lastName: e.target.value})}
                disabled={!editMode}
                variant="outlined"
                className="bg-white"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                disabled={!editMode}
                variant="outlined"
                className="bg-white"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            {editMode && (
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained"
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Save Changes
                </Button>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>

      {/* Address Management Section */}
      <Paper elevation={2} className="p-6">
        <Box className="flex justify-between items-center mb-6">
          <div>
            <Typography variant="h5" component="h2" className="font-bold">
              Addresses
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your delivery addresses
            </Typography>
          </div>
          {profile.additionalAddresses.length < 3 && (
            <Button
              variant="contained"
              onClick={() => setShowAddressForm(true)}
              startIcon={<AddIcon />}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Add Address
            </Button>
          )}
        </Box>

        {showAddressForm && (
          <Paper elevation={1} className="p-6 mb-6">
            <Typography variant="h6" className="mb-4">
              Add New Address
            </Typography>
            <form onSubmit={handleAddressSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={newAddress.street}
                    onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Barangay"
                    value={newAddress.barangay}
                    onChange={e => setNewAddress({...newAddress, barangay: e.target.value})}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={newAddress.city}
                    onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Province"
                    value={newAddress.province}
                    onChange={e => setNewAddress({...newAddress, province: e.target.value})}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={newAddress.postalCode}
                    onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})}
                    required
                    variant="outlined"
                    inputProps={{ pattern: "\\d{4}" }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Address Label</InputLabel>
                    <Select
                      value={newAddress.label}
                      onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                      label="Address Label"
                    >
                      <MenuItem value="Home">
                        <Box className="flex items-center">
                          <Home className="mr-2" /> Home
                        </Box>
                      </MenuItem>
                      <MenuItem value="Work">
                        <Box className="flex items-center">
                          <Work className="mr-2" /> Work
                        </Box>
                      </MenuItem>
                      <MenuItem value="Other">
                        <Box className="flex items-center">
                          <LocationOn className="mr-2" /> Other
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Person"
                    value={newAddress.contactPerson}
                    onChange={e => setNewAddress({...newAddress, contactPerson: e.target.value})}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    value={newAddress.contactNumber}
                    onChange={e => setNewAddress({...newAddress, contactNumber: e.target.value})}
                    required
                    variant="outlined"
                    placeholder="09123456789"
                  />
                </Grid>
              </Grid>
              <Box className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outlined"
                  onClick={() => setShowAddressForm(false)}
                  className="hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Save Address
                </Button>
              </Box>
            </form>
          </Paper>
        )}

        <div className="space-y-4">
          {profile.primaryAddress && (
            <Paper elevation={1} className="p-4">
              <Box className="flex items-center justify-between mb-2">
                <Box className="flex items-center">
                  {profile.primaryAddress.label === 'Home' ? (
                    <Home className="mr-2" />
                  ) : profile.primaryAddress.label === 'Work' ? (
                    <Work className="mr-2" />
                  ) : (
                    <LocationOn className="mr-2" />
                  )}
                  <Typography variant="subtitle1" className="font-semibold">
                    {profile.primaryAddress.label} Address
                  </Typography>
                  <Chip
                    label="Primary"
                    color="primary"
                    size="small"
                    icon={<StarIcon />}
                    className="ml-2"
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {profile.primaryAddress.street}, {profile.primaryAddress.barangay}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {profile.primaryAddress.city}, {profile.primaryAddress.province} {profile.primaryAddress.postalCode}
              </Typography>
              <Typography variant="body2" color="textSecondary" className="mt-2">
                Contact: {profile.primaryAddress.contactPerson} ({profile.primaryAddress.contactNumber})
              </Typography>
            </Paper>
          )}

 {/* Additional Addresses Display */}
 {profile.additionalAddresses.map((address) => (
      <Paper key={address._id} elevation={1} className="p-4">
        <Box className="flex items-center justify-between mb-2">
          <Box className="flex items-center">
            {address.label === 'Home' ? (
              <Home className="mr-2" />
            ) : address.label === 'Work' ? (
              <Work className="mr-2" />
            ) : (
              <LocationOn className="mr-2" />
            )}
            <Typography variant="subtitle1" className="font-semibold">
              {address.label} Address
            </Typography>
          </Box>
          <Box className="flex items-center space-x-2">
            <Button
              variant="outlined"
              size="small"
              startIcon={<StarIcon />}
              onClick={() => handleSetPrimaryAddress(address._id)}
              className="hover:bg-blue-50"
            >
              Set as Primary
            </Button>
            <IconButton
              size="small"
              onClick={() => handleDeleteAddress(address._id)}
              className="hover:bg-red-50 text-red-500"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {address.street}, {address.barangay}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {address.city}, {address.province} {address.postalCode}
        </Typography>
        <Typography variant="body2" color="textSecondary" className="mt-2">
          Contact: {address.contactPerson} ({address.contactNumber})
        </Typography>
      </Paper>
    ))}
  </div>
</Paper>
    </Box>
  );
};

export default ProfileManagement;