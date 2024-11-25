// src/admin/product/supplier/validation/supplierValidation.js

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_REGEX = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export const validateSupplierForm = (data) => {
  const errors = {};

  // Basic Information
  if (!data.name?.trim()) {
    errors.name = 'Company name is required';
  } else if (data.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name.length > 100) {
    errors.name = 'Name cannot exceed 100 characters';
  }

  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Invalid email format';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!PHONE_REGEX.test(data.phone.trim())) {
    errors.phone = 'Invalid phone number format';
  }

  if (data.description?.length > 2000) {
    errors.description = 'Description cannot exceed 2000 characters';
  }

  // Address Validation
  if (!data.address?.street?.trim()) {
    errors['address.street'] = 'Street address is required';
  }

  if (!data.address?.city?.trim()) {
    errors['address.city'] = 'City is required';
  }

  if (!data.address?.state?.trim()) {
    errors['address.state'] = 'State is required';
  }

  if (!data.address?.country?.trim()) {
    errors['address.country'] = 'Country is required';
  }

  if (!data.address?.zipCode?.trim()) {
    errors['address.zipCode'] = 'ZIP code is required';
  } else if (!ZIP_REGEX.test(data.address.zipCode.trim())) {
    errors['address.zipCode'] = 'Invalid ZIP code format';
  }

  // Additional Information
  if (data.currency && !data.currency.trim()) {
    errors.currency = 'Please select a currency';
  }

  if (data.paymentTerms && !data.paymentTerms.trim()) {
    errors.paymentTerms = 'Please select payment terms';
  }

  return errors;
};

export const validateImage = (file, config = {}) => {
  const errors = [];
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    acceptedFormats = ['image/jpeg', 'image/png', 'image/gif']
  } = config;

  if (!file) return errors;

  if (file.size > maxSize) {
    errors.push(`File size should not exceed ${maxSize / (1024 * 1024)}MB`);
  }

  if (!acceptedFormats.includes(file.type)) {
    errors.push(`Only ${acceptedFormats.join(', ')} files are allowed`);
  }

  return errors;
};