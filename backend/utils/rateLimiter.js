// utils/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Common configuration
const commonConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
};

// General API rate limiter
export const apiLimiter = rateLimit({
    ...commonConfig,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        status: 'error',
        message: 'Too many requests, please try again later.',
        code: 'API_RATE_LIMIT_EXCEEDED'
    }
});

// Authentication routes limiter (login, register, password reset)
export const authLimiter = rateLimit({
    ...commonConfig,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    message: {
        status: 'error',
        message: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});

// Email verification limiter
export const emailVerificationLimiter = rateLimit({
    ...commonConfig,
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 3, // limit each IP to 3 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many verification email requests. Please try again in an hour.',
        code: 'EMAIL_VERIFICATION_LIMIT_EXCEEDED'
    }
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
    ...commonConfig,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        status: 'error',
        message: 'Too many password reset attempts. Please try again in an hour.',
        code: 'PASSWORD_RESET_LIMIT_EXCEEDED'
    }
});

// Profile update limiter
export const profileLimiter = rateLimit({
    ...commonConfig,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 updates per 15 minutes
    message: {
        status: 'error',
        message: 'Too many profile update attempts. Please try again later.',
        code: 'PROFILE_UPDATE_LIMIT_EXCEEDED'
    }
});

// Custom limiter factory
export const createEndpointLimiter = (maxRequests, windowMinutes, message) => {
    return rateLimit({
        ...commonConfig,
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: {
            status: 'error',
            message: message || `Too many requests. Limit is ${maxRequests} requests per ${windowMinutes} minutes.`,
            code: 'CUSTOM_RATE_LIMIT_EXCEEDED'
        }
    });
};

export default {
    apiLimiter,
    authLimiter,
    emailVerificationLimiter,
    passwordResetLimiter,
    profileLimiter,
    createEndpointLimiter
};