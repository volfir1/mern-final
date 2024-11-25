import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';

// Common configuration
const commonConfig = {
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

// Memory store fallback
const limiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
};

// General API rate limiter
export const apiLimiter = rateLimit({
    ...commonConfig,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});

// Stricter limiter for auth routes
export const authLimiter = rateLimit({
    ...commonConfig,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});

// Create custom rate limiters
export const createEndpointLimiter = (maxRequests, windowMinutes) => {
    return rateLimit({
        ...commonConfig,
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: {
            success: false,
            message: `Too many requests. Limit is ${maxRequests} requests per ${windowMinutes} minutes.`
        }
    });
};

// Optional: Redis store setup if you want to use it
if (process.env.REDIS_URL) {
    try {
        const redis = new Redis(process.env.REDIS_URL);
        console.log('Redis connected for rate limiting');

        // You can implement custom store with Redis if needed
        // This is optional and can be added later
    } catch (error) {
        console.error('Redis connection failed:', error);
    }
}