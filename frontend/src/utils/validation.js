// src/admin/product/supplier/utils/validation.js

export const validateForm = (formData) => {
    const errors = {};
  
    // Basic Information Validation
    if (!formData.name?.trim()) {
      errors.name = 'Company name is required';
    }
  
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
  
    if (!formData.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number';
    }
  
    // Address Validation
    if (!formData.address?.street?.trim()) {
      errors['address.street'] = 'Street address is required';
    }
  
    if (!formData.address?.city?.trim()) {
      errors['address.city'] = 'City is required';
    }
  
    if (!formData.address?.state?.trim()) {
      errors['address.state'] = 'State/Province is required';
    }
  
    if (!formData.address?.country?.trim()) {
      errors['address.country'] = 'Country is required';
    }
  
    if (!formData.address?.zipCode?.trim()) {
      errors['address.zipCode'] = 'ZIP/Postal code is required';
    }
  
    return errors;
  };
  
  export const validateImage = (file) => {
    if (!file) return null;
  
    const { maxSize, acceptedFormats } = IMAGE_CONFIG;
  
    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }
  
    if (!acceptedFormats.includes(file.type)) {
      return 'Invalid file format. Please use JPEG, PNG, or GIF';
    }
  
    return null;
  };
  
  export const isFormValid = (formData) => {
    const errors = validateForm(formData);
    return Object.keys(errors).length === 0;
  };
  
  export const validateField = (name, value, formData = {}) => {
    const errors = validateForm({
      ...formData,
      [name]: value
    });
    return errors[name] || '';
  };
  
  // Helper function to format validation errors for display
  export const formatValidationError = (error) => {
    if (!error) return '';
    return error.charAt(0).toUpperCase() + error.slice(1);
  };