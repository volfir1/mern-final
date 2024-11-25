import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Enhanced Constants with subcategory configuration
const FILE_CONFIG = {
  PROFILE: {
    maxSize: 2 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    maxCount: 1,
    fieldName: "image",
    dimensions: {
      width: 500,
      height: 500,
    },
  },
  PRODUCT: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxCount: 5,
    fieldName: "images",
    dimensions: {
      width: 1200,
      height: 1200,
    },
  },
  CATEGORY: {
    maxSize: 3 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    maxCount: 1,
    fieldName: "image",
    dimensions: {
      width: 800,
      height: 600,
    },
  },
  SUBCATEGORY: {
    maxSize: 2 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    maxCount: 1,
    fieldName: "image",
    dimensions: {
      width: 400,
      height: 300,
    },
  },
  DOCUMENT: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxCount: 3,
    fieldName: "documents",
  },
};

// Validate file
const validateFile = (file, config) => {
  const errors = [];

  if (!config.allowedTypes.includes(file.mimetype)) {
    errors.push({
      code: "INVALID_FILE_TYPE",
      message: `Invalid file type. Allowed types: ${config.allowedTypes.join(
        ", "
      )}`,
    });
  }

  if (file.size > config.maxSize) {
    errors.push({
      code: "FILE_TOO_LARGE",
      message: `File too large. Maximum size: ${config.maxSize / (1024 * 1024)}MB`,
    });
  }

  return errors;
};

// Storage configuration
const storage = multer.memoryStorage();

// Create file filter
const createFileFilter = (config) => (req, file, cb) => {
  const errors = validateFile(file, config);

  if (errors.length > 0) {
    req.fileValidationErrors = req.fileValidationErrors || [];
    req.fileValidationErrors.push(...errors);
    cb(null, false);
  } else {
    cb(null, true);
  }
};

// Create multer instance
const createMulterInstance = (config) => {
  return multer({
    storage,
    limits: {
      fileSize: config.maxSize,
      files: config.maxCount,
    },
    fileFilter: createFileFilter(config),
  });
};

// Enhanced middleware factory
const createUploadMiddleware = {
  profile: () => {
    return wrapMulterMiddleware(
      createMulterInstance(FILE_CONFIG.PROFILE).single(FILE_CONFIG.PROFILE.fieldName)
    );
  },

  product: () => {
    return wrapMulterMiddleware(
      createMulterInstance(FILE_CONFIG.PRODUCT).array(FILE_CONFIG.PRODUCT.fieldName, FILE_CONFIG.PRODUCT.maxCount)
    );
  },

  category: () => {
    return wrapMulterMiddleware(
      createMulterInstance(FILE_CONFIG.CATEGORY).single(FILE_CONFIG.CATEGORY.fieldName)
    );
  },

  subcategory: () => {
    return wrapMulterMiddleware(
      createMulterInstance(FILE_CONFIG.SUBCATEGORY).single(FILE_CONFIG.SUBCATEGORY.fieldName)
    );
  },

  document: () => {
    return wrapMulterMiddleware(
      createMulterInstance(FILE_CONFIG.DOCUMENT).array(FILE_CONFIG.DOCUMENT.fieldName, FILE_CONFIG.DOCUMENT.maxCount)
    );
  },

  custom: (customConfig) => {
    const config = {
      maxSize: customConfig.maxSize || 5 * 1024 * 1024,
      allowedTypes: customConfig.allowedTypes || FILE_CONFIG.PROFILE.allowedTypes,
      maxCount: customConfig.maxCount || 1,
      fieldName: customConfig.fieldName || "file",
    };

    const upload = createMulterInstance(config);
    return wrapMulterMiddleware(
      config.maxCount === 1
        ? upload.single(config.fieldName)
        : upload.array(config.fieldName, config.maxCount)
    );
  },
};

// Error handler
const HandleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const errorResponse = {
      success: false,
      error: {
        type: "UPLOAD_ERROR",
        code: error.code,
        field: error.field,
        message: getMulterErrorMessage(error),
      },
    };

    return res.status(400).json(errorResponse);
  }

  if (req.fileValidationErrors) {
    return res.status(400).json({
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        errors: req.fileValidationErrors,
      },
    });
  }

  next(error);
};

// Get error message
const getMulterErrorMessage = (error) => {
  const errorMessages = {
    LIMIT_FILE_SIZE: `File too large. Maximum size allowed is ${
      error.field && FILE_CONFIG[error.field]
        ? FILE_CONFIG[error.field].maxSize / (1024 * 1024)
        : "5"
    }MB`,
    LIMIT_FILE_COUNT: `Too many files. Maximum allowed is ${
      error.field && FILE_CONFIG[error.field]
        ? FILE_CONFIG[error.field].maxCount
        : "1"
    } files`,
    LIMIT_UNEXPECTED_FILE: `Invalid field name for file upload: ${error.field}`,
    LIMIT_FIELD_KEY: "Field name too long",
    LIMIT_FIELD_VALUE: "Field value too long",
    LIMIT_FIELD_COUNT: "Too many fields",
    LIMIT_PART_COUNT: "Too many parts in multipart form",
  };

  return errorMessages[error.code] || "Error processing file upload";
};

// Wrapper middleware
const wrapMulterMiddleware = (uploadMiddleware) => {
  return async (req, res, next) => {
    try {
      await new Promise((resolve, reject) => {
        uploadMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (req.file) {
        req.fileMetadata = processFileMetadata(req.file);
      }
      if (req.files) {
        req.filesMetadata = req.files.map(processFileMetadata);
      }

      if (req.fileValidationErrors?.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            type: "VALIDATION_ERROR",
            errors: req.fileValidationErrors,
          },
        });
      }

      next();
    } catch (error) {
      HandleMulterError(error, req, res, next);
    }
  };
};

// Process file metadata
const processFileMetadata = (file) => ({
  id: uuidv4(),
  fieldname: file.fieldname,
  originalname: file.originalname,
  encoding: file.encoding,
  mimetype: file.mimetype,
  size: file.size,
  buffer: file.buffer,
  createdat: new Date().toISOString(),
});

export { createUploadMiddleware, HandleMulterError, FILE_CONFIG };
