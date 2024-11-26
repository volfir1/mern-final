// utils/errorHandlers.js
class AppError extends Error {
    constructor(message, statusCode, extras = {}) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
      Object.assign(this, extras);
      Error.captureStackTrace(this, this.constructor);
    }
  
    toJSON() {
      return {
        status: this.status,
        message: this.message,
        ...(this.errors && { errors: this.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
      };
    }
  }
  
  class ValidationError extends AppError {
    constructor(errors) {
      super('Validation Error', 400, { errors });
      this.name = 'ValidationError';
    }
  }
  
  const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  const errorLogger = (error, req, res, next) => {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    next(error);
  };
  
  const errorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const status = error.status || 'error';
    
    res.status(statusCode).json({
      status,
      message: error.message,
      ...(error.errors && { errors: error.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  };
  
  // Single export statement for everything
  export {
    AppError,
    ValidationError,
    asyncHandler,
    errorLogger,
    errorHandler
  };
  
  // Default export
  export default AppError;