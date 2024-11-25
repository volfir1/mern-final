// utils/asyncHandler.js

export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Error caught by asyncHandler:', {
        endpoint: `${req.method} ${req.originalUrl}`,
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
  
      // Handle different types of errors
      switch (error.name) {
        case 'ValidationError':
          return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(error.errors).map(err => ({
              field: err.path,
              message: err.message
            }))
          });
  
        case 'CastError':
          return res.status(400).json({
            success: false,
            message: `Invalid ${error.path}: ${error.value}`
          });
  
        default:
          // Handle MongoDB duplicate key error
          if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
              success: false,
              message: `Duplicate value for ${field}`
            });
          }
  
          // Default server error
          return res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' 
              ? error.message 
              : 'Internal Server Error'
          });
      }
    });
  };
  
  // Make sure we're exporting as default as well
  export default asyncHandler;