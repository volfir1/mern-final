// middleware/validation.js
import { check, validationResult } from 'express-validator';

export const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

const profileValidationRules = [
    check('firstName')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('First name must be at least 2 characters long'),
    check('lastName')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Last name must be at least 2 characters long'),
    check('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    check('phone')
        .optional()
        .matches(/^(09|\+639)\d{9}$/)
        .withMessage('Please provide a valid Philippine mobile number'),
];

export const productRules = {
  create: [
    check('name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be between 3 and 100 characters'),
    
    check('price')
      .notEmpty()
      .withMessage('Price is required')
      .isFloat({ min: 0 })
      .withMessage('Price must be a valid positive number'),
    
    check('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative number'),
    
    check('lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative number'),
  ],
  update: [
    check('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be between 3 and 100 characters'),
    
    check('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a valid positive number'),
    
    check('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative number'),
    
    check('lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative number'),
  ]
};

// Registration validation rules
export const registerRules = [
    check('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2 })
      .withMessage('First name must be at least 2 characters long'),
  
    check('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2 })
      .withMessage('Last name must be at least 2 characters long'),
  
    check('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .toLowerCase(),
  
    check('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  
    // Optional image validation
    check('profileImage').optional(),
  ];
  

// Login validation rules (simplified for Firebase)
const loginRules = [
    check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
        .customSanitizer(value => value.toLowerCase()),
    check('idToken')  // For Firebase ID token
        .optional()
        .isString()
        .withMessage('Invalid ID token format')
];

// Update user validation rules
const updateUserRules = [
    check('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    check('image')
        .optional()
        .custom((value, { req }) => {
            if (req.file) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(req.file.mimetype)) {
                    throw new Error('Invalid file type. Only JPEG, PNG and GIF are allowed');
                }
                if (req.file.size > 5 * 1024 * 1024) { // 5MB limit
                    throw new Error('File size too large. Maximum size is 5MB');
                }
            }
            return true;
        })
];

// Email validation rules
const emailRules = [
    check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
        .customSanitizer(value => value.toLowerCase())
];

// Token validation rules
const tokenRules = [
    check('token')
        .exists()
        .withMessage('Token is required')
        .isString()
        .withMessage('Invalid token format')
];

// Password validation rules
const passwordRules = [
    check('password')
        .exists().withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('Password must contain at least one number')
        .matches(/[a-zA-Z]/)
        .withMessage('Password must contain at least one letter')
];

// Password reset validation rules
const resetPasswordRules = [
    ...passwordRules,
    check('confirmPassword')
        .exists()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        })
];

// Password change validation rules
const passwordChangeRules = [
    check('currentPassword')
        .exists()
        .withMessage('Current password is required'),
    check('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('New password must contain at least one number')
        .matches(/[a-zA-Z]/)
        .withMessage('New password must contain at least one letter')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        }),
    check('confirmPassword')
        .exists()
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        })
];

const roleRules = [
    check('role')
        .exists()
        .withMessage('Role is required')
        .isIn(['user', 'admin'])
        .withMessage('Invalid role specified')
];  

//For catrgory
const categoryRules = {
    create: [
      check('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
      check('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
      check('image')
        .optional()
        .custom((value, { req }) => {
          if (req.file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
              throw new Error('Invalid file type. Only JPEG, PNG and WEBP are allowed');
            }
            if (req.file.size > 2 * 1024 * 1024) { // 2MB limit
              throw new Error('File size too large. Maximum size is 2MB');
            }
          }
          return true;
        })
    ],
    update: [
      check('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
      check('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
      check('image')
        .optional()
        .custom((value, { req }) => {
          if (req.file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
              throw new Error('Invalid file type. Only JPEG, PNG and WEBP are allowed');
            }
            if (req.file.size > 2 * 1024 * 1024) {
              throw new Error('File size too large. Maximum size is 2MB');
            }
          }
          return true;
        })
    ]
  };

  
export const updateRoleValidation = [...roleRules, handleValidation];
export const registerValidation = [...registerRules, handleValidation];
export const loginValidation = [...loginRules, handleValidation];
export const updateUserValidation = [...updateUserRules, handleValidation];
export const emailValidation = [...emailRules, handleValidation];
export const tokenValidation = [...tokenRules, handleValidation];
export const passwordValidation = [...passwordRules, handleValidation];
export const resetPasswordValidation = [...resetPasswordRules, handleValidation];
export const changePasswordValidation = [...passwordChangeRules, handleValidation];
export const profileValidation = [...profileValidationRules, handleValidation];
export const createCategoryValidation = [...categoryRules.create, handleValidation];
export const updateCategoryValidation = [...categoryRules.update, handleValidation];
export default {
    registerValidation,
    loginValidation,
    updateUserValidation,
    emailValidation,
    tokenValidation,
    passwordValidation,
    resetPasswordValidation,
    profileValidation,
    changePasswordValidation,
    updateRoleValidation, 
    handleValidation,

    //category valdiation
    createCategoryValidation,
    updateCategoryValidation,
};