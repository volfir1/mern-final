// middleware/multer.js
import multer from "multer";
import { validateFileUpload } from '../utils/firebase.js';

// File type constants
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml"
];

// File size limits
const FILE_SIZE_LIMITS = {
  FIREBASE: 5 * 1024 * 1024,    // 5MB for Firebase
  CLOUDINARY: 10 * 1024 * 1024  // 10MB for Cloudinary
};

const MAX_FILES = 5;

// Authentication and form fields configuration
const AUTH_FIELDS = {
  REGISTER: [
    { name: 'firstName', maxCount: 1 },
    { name: 'lastName', maxCount: 1 },
    { name: 'email', maxCount: 1 },
    { name: 'password', maxCount: 1 },
    { name: 'phoneNumber', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
  ],
  LOGIN: [
    { name: 'email', maxCount: 1 },
    { name: 'password', maxCount: 1 }
  ],
  EMAIL_VERIFICATION: [
    { name: 'email', maxCount: 1 }
  ],
  PASSWORD_RESET: [
    { name: 'email', maxCount: 1 },
    { name: 'oobCode', maxCount: 1 },
    { name: 'newPassword', maxCount: 1 },
    { name: 'confirmPassword', maxCount: 1 }
  ],
  PROFILE_UPDATE: [
    { name: 'firstName', maxCount: 1 },
    { name: 'lastName', maxCount: 1 },
    { name: 'phoneNumber', maxCount: 1 },
    { name: 'bio', maxCount: 1 },
    { name: 'gender', maxCount: 1 },
    { name: 'dateOfBirth', maxCount: 1 },
    { name: 'address', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
  ],
  PRODUCT: [
    { name: 'title', maxCount: 1 },
    { name: 'description', maxCount: 1 },
    { name: 'price', maxCount: 1 },
    { name: 'category', maxCount: 1 },
    { name: 'subcategory', maxCount: 1 },
    { name: 'brand', maxCount: 1 },
    { name: 'images', maxCount: MAX_FILES } // Allow multiple images
  ]
};

// Upload types configuration
const UPLOAD_TYPES = {
  AUTH: {
    fieldName: 'profileImage',
    destination: 'NONE',
    maxSize: 10 * 1024 * 1024,
    fields: AUTH_FIELDS.REGISTER,
    limits: {
      fieldNameSize: 300,
      fieldSize: 20 * 1024 * 1024,  // Increase field size limit
      fields: 20,
      fileSize: 10 * 1024 * 1024,  // 10MB
      files: 1,
      parts: 50  // Increase parts limit
    }
  },
  PROFILE: {
    fieldName: 'profileImage',
    destination: 'CLOUDINARY',
    maxSize: FILE_SIZE_LIMITS.CLOUDINARY
  },
  PRODUCT: {
    fieldName: 'images',
    destination: 'CLOUDINARY',
    maxSize: FILE_SIZE_LIMITS.CLOUDINARY,
    maxCount: MAX_FILES,
    fields: AUTH_FIELDS.PRODUCT
  },
  CATEGORY: {
    fieldName: 'image',
    destination: 'CLOUDINARY',
    maxSize: FILE_SIZE_LIMITS.CLOUDINARY
  },
  SUBCATEGORY: {
    fieldName: 'image',
    destination: 'CLOUDINARY',
    maxSize: FILE_SIZE_LIMITS.CLOUDINARY
  },
  FORM: {
    destination: 'NONE',
    maxSize: 1 * 1024 * 1024
  }
};

// Storage configuration
const storage = multer.memoryStorage();

// Enhanced file filter function
const createFileFilter = (uploadType) => {
  return (req, file, cb) => {
    try {
      // Skip file validation for form-only requests or when no file is present
      if (uploadType.destination === 'NONE' || !file) {
        return cb(null, true);
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type. Allowed types are: ${ALLOWED_FILE_TYPES.join(", ")}`));
      }

      // Service-specific validation
      if (uploadType.destination === 'FIREBASE') {
        validateFileUpload(file);
      }

      // For products, allow multiple images
      if (uploadType === UPLOAD_TYPES.PRODUCT) {
        const totalFiles = Object.keys(req.files || {}).length;
        if (totalFiles >= MAX_FILES) {
          return cb(new Error(`Maximum ${MAX_FILES} images allowed`));
        }
      }

      if (uploadType.destination === 'CLOUDINARY') {
        if (file.size > FILE_SIZE_LIMITS.CLOUDINARY) {
          return cb(new Error(`File too large. Maximum size is ${FILE_SIZE_LIMITS.CLOUDINARY / (1024 * 1024)}MB`));
        }
      }

      cb(null, true);
    } catch (error) {
      cb(new Error(error.message));
    }
  };
};

// Create multer instance with configuration
const createMulterInstance = (uploadType) => {
  return multer({
    storage,
    limits: {
      fileSize: uploadType.maxSize || FILE_SIZE_LIMITS.FIREBASE,
      files: uploadType.maxCount || 1,
      fieldSize: 20 * 1024 * 1024, // Increased field size
      fields: 20,
      parts: 30
    },
    fileFilter: createFileFilter(uploadType)
  });
};

// Middleware factory
export const createUploadMiddleware = {
  product: () => {
    const upload = createMulterInstance({
      ...UPLOAD_TYPES.PRODUCT,
      fields: AUTH_FIELDS.PRODUCT
    });

    return (req, res, next) => {
      console.log('Processing product upload...');
      console.log('Content-Type:', req.headers['content-type']);

      upload.fields(AUTH_FIELDS.PRODUCT)(req, res, (err) => {
        if (err) {
          console.error('Product upload error:', err);
          return HandleMulterError(err, req, res, next);
        }

        // Log received data
        console.log('Received product fields:', {
          ...req.body
        });
        console.log('Received product images:', Object.keys(req.files || {}));

        // Normalize form fields
        Object.keys(req.body).forEach(key => {
          if (Array.isArray(req.body[key])) {
            req.body[key] = req.body[key][0];
          }
        });

        // Handle numeric fields
        if (req.body.price) {
          req.body.price = parseFloat(req.body.price);
        }

        next();
      });
    };
  },

  // Category middleware
  category: () => {
    const upload = createMulterInstance(UPLOAD_TYPES.CATEGORY);
    return wrapMulterMiddleware(upload.single('image'));
  },

  // Subcategory middleware
  subcategory: () => {
    const upload = createMulterInstance(UPLOAD_TYPES.SUBCATEGORY);
    return wrapMulterMiddleware(upload.single('image'));
  },

  // Registration middleware
  register: () => {
    return (req, res, next) => {
      const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 25 * 1024 * 1024,
          fieldSize: 25 * 1024 * 1024,
          fields: 20,
          files: 1,
          parts: 100
        },
        preservePath: true
      }).fields([
        { name: 'firstName', maxCount: 1 },
        { name: 'lastName', maxCount: 1 },
        { name: 'email', maxCount: 1 },
        { name: 'password', maxCount: 1 },
        { name: 'phoneNumber', maxCount: 1 },
        { name: 'profileImage', maxCount: 1 }
      ]);
  
      if (!req.is('multipart/form-data')) {
        return next();
      }
  
      upload(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          return res.status(400).json({
            status: 'error',
            message: 'File upload error',
            details: err.message
          });
        }
        next();
      });
    };
  },
  // Profile middleware
  profile: () => {
    const upload = createMulterInstance(UPLOAD_TYPES.PROFILE);
    return wrapMulterMiddleware(upload.fields(AUTH_FIELDS.PROFILE_UPDATE));
  },

  // Form-only middleware (no files)
  form: () => {
    return (req, res, next) => {
      // If content-type is application/json, skip multer
      if (req.headers['content-type']?.includes('application/json')) {
        return next();
      }

      const upload = multer({
        storage: multer.memoryStorage()
      }).none(); // For form data without files

      upload(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          return res.status(400).json({
            status: 'error',
            message: 'Error processing form data',
            error: err.message
          });
        }
        next();
      });
    };
  },

  // Custom middleware factory
  custom: (config) => {
    const customConfig = {
      ...UPLOAD_TYPES.FORM,
      ...config
    };
    const upload = createMulterInstance(customConfig);
    return wrapMulterMiddleware(upload.fields(config.fields || []));
  },

  // Specific middlewares for different auth operations
  login: () => {
    const upload = createMulterInstance(UPLOAD_TYPES.FORM);
    return wrapMulterMiddleware(upload.fields(AUTH_FIELDS.LOGIN));
  },

  verifyEmail: () => {
    const upload = createMulterInstance(UPLOAD_TYPES.FORM);
    return wrapMulterMiddleware(upload.fields(AUTH_FIELDS.EMAIL_VERIFICATION));
  },

  resetPassword: () => {
    const upload = createMulterInstance(UPLOAD_TYPES.FORM);
    return wrapMulterMiddleware(upload.fields(AUTH_FIELDS.PASSWORD_RESET));
  }
};

// Enhanced wrapper function
const wrapMulterMiddleware = (multerMiddleware) => {
  if (!multerMiddleware || typeof multerMiddleware !== 'function') {
    throw new Error('Invalid multer middleware');
  }

  return (req, res, next) => {
    console.log('Starting file upload process...');
    console.log('Content-Type:', req.headers['content-type']);
    
    multerMiddleware(req, res, (err) => {
      if (err) {
        return HandleMulterError(err, req, res, next);
      }

      // Normalize form fields
      if (req.body) {
        Object.keys(req.body).forEach(key => {
          if (Array.isArray(req.body[key])) {
            req.body[key] = req.body[key][0];
          }
        });
      }

      console.log('Upload completed successfully');
      next();
    });
  };
};

// Error handler
export const HandleMulterError = (error, req, res, next) => {
  console.error('Multer Error:', {
    name: error.name,
    message: error.message,
    code: error.code,
    field: error.field
  });

  if (error instanceof multer.MulterError) {
    const errorMessages = {
      LIMIT_FILE_SIZE: `File too large. Maximum size is ${FILE_SIZE_LIMITS.FIREBASE / (1024 * 1024)}MB`,
      LIMIT_FILE_COUNT: `Too many files. Maximum is ${MAX_FILES} files`,
      LIMIT_FIELD_KEY: "Field name too long",
      LIMIT_FIELD_VALUE: "Field value too long",
      LIMIT_FIELD_COUNT: "Too many fields",
      LIMIT_UNEXPECTED_FILE: "Unexpected field",
      LIMIT_PART_COUNT: "Too many parts in multipart form"
    };

    return res.status(400).json({
      status: 'error',
      message: errorMessages[error.code] || error.message,
      error: {
        code: error.code,
        field: error.field,
        type: 'MulterError'
      }
    });
  }

  // Handle non-Multer errors
  return res.status(500).json({
    status: 'error',
    message: error.message || 'File upload error',
    error: {
      type: 'General',
      details: error.toString()
    }
  });
};

// Export everything needed
export {
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  MAX_FILES,
  UPLOAD_TYPES,
  AUTH_FIELDS
};