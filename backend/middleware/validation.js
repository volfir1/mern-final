// middleware/validation.js
import { check, body, query, validationResult } from 'express-validator';
import multer from 'multer';
// Base Error Class
class ValidationError extends Error {
  constructor(errors) {
    super('Validation Error');
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

// Validation handler
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: validationErrors
    });
  }
  next();
};

// Registration validation
export const validateRegistration = [
  check('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  check('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  check('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  check('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter'),
  handleValidation
];

// Login validation
export const validateLogin = [
  check('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  check('password')
    .notEmpty().withMessage('Password is required'),
  handleValidation
];

// Email validation
export const validateEmail = [
  check('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  handleValidation
];

// Verify email validation
export const validateVerifyEmail = [
  query('oobCode')
    .notEmpty().withMessage('Verification code is required'),
  handleValidation
];

// Password validations
export const validatePassword = [
  check('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  check('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .matches(/\d/).withMessage('New password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('New password must contain at least one letter')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  handleValidation
];

export const validateForgotPassword = [
  check('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  handleValidation
];

export const validateResetPassword = [
  check('oobCode')
    .notEmpty().withMessage('Reset code is required'),
  check('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter'),
  handleValidation
];

// Profile validation
export const validateProfile = [
  check('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  check('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  check('phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).withMessage('Invalid phone number format'),
  check('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  check('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer not to say']).withMessage('Invalid gender value'),
  check('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  handleValidation
];

export const validateEmailVerification = [
  check('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
  check('oobCode')
      .optional()
      .isString().withMessage('Verification code must be a string'),
  handleValidation
];
// Export everything as named exports
export default {
  handleValidation,
  validateRegistration,
  validateLogin,
  validateEmail,
  validateVerifyEmail,
  validateEmailVerification,
  validatePassword,
  validateForgotPassword,
  validateResetPassword,
  validateProfile
};