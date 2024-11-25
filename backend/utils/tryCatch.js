// middleware/tryCatch.js

/**
 * Simple try-catch wrapper for async functions
 * @param {Function} fn The async function to wrap
 * @returns {Function} Wrapped function
 */
export const tryCatch = (fn) => async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal Server Error'
      });
    }
  };