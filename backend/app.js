import express from 'express';
import productRoutes from "./routes/product.js";
import categoryRoutes from "./routes/category.js";
import authRoutes from "./routes/authRoutes.js";
import subcategoryRoutes from "./routes/subcategory.js";
import supplierRoutes from "./routes/supplier.js";
import { deleteFirebaseUser, deleteAllFirebaseUsers } from "./utils/cleanupFirebase.js";
import { asyncHandler, AppError } from "./utils/errorHandlers.js";
import { auth as firebaseAuth } from "./config/firebase-admin.js";
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { apiLimiter, authLimiter } from './utils/rateLimiter.js';

const router = express.Router();

router.use(mongoSanitize());
router.use(xss());

// Comment out rate limiters during development
// router.use('/auth', authLimiter);
// router.use('/', apiLimiter);

const publicPaths = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/google',
    '/api/auth/refresh-token',
    '/api/auth/verify-email',
    '/api/health',
];

// Comment out token validation for development
/*
const validateFirebaseToken = asyncHandler(async (req, res, next) => {
    if (publicPaths.includes(req.path)) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
    }

    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        throw new AppError('Invalid or expired token', 401);
    }
});
*/

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Mount routes without token validation
router.use('/auth', authRoutes);
// router.use(validateFirebaseToken);  // Comment out token validation
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/suppliers', supplierRoutes);

router.get('/debug/routes', (req, res) => {
    const routes = [];
    
    const processRoute = (stack) => {
        stack.forEach(middleware => {
            if (middleware.route) {
                const path = middleware.route.path;
                const methods = Object.keys(middleware.route.methods);
                routes.push({ 
                    path,
                    methods,
                    fullPath: `/api${path}`,
                    protected: false  // Set all routes as unprotected during development
                });
            } else if (middleware.name === 'router') {
                processRoute(middleware.handle.stack);
            }
        });
    };

    processRoute(router.stack);
    
    res.json({
        total: routes.length,
        routes
    });
});

export default router;