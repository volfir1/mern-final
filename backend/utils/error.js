const handleJWTExpiredError = () => 
    new ApiError('Your token has expired. Please log in again.', 401);
  
  // Development error response
  const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    });
  };
  
  // Production error response
  const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    } 
    // Programming or other unknown error: don't leak error details
    else {
      // Log error for debugging
      console.error('ERROR 💥', err);
  
      // Send generic message
      res.status(500).json({
        success: false,
        message: 'Something went wrong'
      });
    }
  };
  
  // Main error handling middleware
  export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    if (process.env.NODE_ENV === 'development') {
      sendErrorDev(err, res);
    } else {
      let error = { ...err };
      error.message = err.message;
  
      // Handle different types of errors
      if (error.code === 11000) error = handleDuplicateKeyError(error);
      if (error.name === 'ValidationError') error = handleValidationError(error);
      if (error.name === 'CastError') error = handleCastError(error);
      if (error.name === 'JsonWebTokenError') error = handleJWTError();
      if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
      sendErrorProd(error, res);
    }
  };
  
  // Catch async errors
  export const catchAsync = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };
  
  // Not found error handler
  export const notFound = (req, res, next) => {
    const error = new ApiError(`Not found - ${req.originalUrl}`, 404);
    next(error);
  };
  
  // Validation error handler
  export const handleValidationErrors = (err, req, res, next) => {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    next(err);
  };
  
  // Database error handler
  export const handleDatabaseErrors = (err, req, res, next) => {
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `A record with this ${field} already exists`
        });
      }
    }
    next(err);
  };
  
  // Rate limit error handler
  export const handleRateLimitError = (err, req, res, next) => {
    if (err.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later'
      });
    }
    next(err);
  };
  
  // Request timeout handler
  export const handleTimeout = (req, res, next) => {
    res.setTimeout(30000, function() {
      res.status(408).json({
        success: false,
        message: 'Request timeout'
      });
    });
    next();
  };
  
  // Custom error types
  export class ValidationError extends ApiError {
    constructor(message) {
      super(message, 400);
    }
  }
  
  export class AuthenticationError extends ApiError {
    constructor(message = 'Authentication failed') {
      super(message, 401);
    }
  }
  
  export class AuthorizationError extends ApiError {
    constructor(message = 'Not authorized to access this resource') {
      super(message, 403);
    }
  }
  
  export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
      super(message, 404);
    }
  }
  
  export class ConflictError extends ApiError {
    constructor(message = 'Resource already exists') {
      super(message, 409);
    }
  }