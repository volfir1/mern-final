// app.js
import express from "express";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import xss from "xss-clean";

// Import routes
import productRoutes from "./routes/product.js";
import categoryRoutes from "./routes/category.js";
import subcategoryRoutes from "./routes/subcategory.js";
import supplierRoutes from "./routes/supplier.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import profileRoutes from "./routes/profile.js";
import cartRoutes from './routes/cart.js';
import paymentRoutes from './routes/payment.js';
import orderRoutes from './routes/order.js';
import { handleWebhook } from './controllers/payment.js';
import checkoutRoutes from './routes/checkout.js'; // ✅ CORRECT

// Import middleware
import { protect, securityHeaders } from "./middleware/auth.js";
import { handleValidationErrors } from "./middleware/errorHandler.js";

// Initialize router
const router = express.Router();

// Stripe webhook route must be first, before any middleware
router.post('/payments/webhook',
    express.raw({type: 'application/json'}),
    handleWebhook
);

// Apply security headers
router.use(securityHeaders);

// API Security Middleware
router.use(helmet());
router.use(mongoSanitize());
router.use(xss());
router.use(hpp());

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later'
});

// Apply rate limiter to auth routes
router.use('/auth', authLimiter);

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
    });
});

// API Documentation route
router.get('/docs', (req, res) => {
    res.redirect(process.env.API_DOCS_URL || '/api-docs');
});

// Public routes
router.use("/auth", authRoutes);

// Protected routes - apply authentication middleware
router.use(protect);

// Apply routes that require authentication
router.use("/products", productRoutes);
router.use("/profile", profileRoutes);
router.use("/categories", categoryRoutes);
router.use("/categories/:categoryId/subcategories", subcategoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/users", userRoutes);
router.use('/checkout', checkoutRoutes);

// Development routes
if (process.env.NODE_ENV === 'development') {
    router.get('/debug/routes', (req, res) => {
        const routes = [];
        router.stack.forEach(middleware => {
            if (middleware.route) {
                routes.push({
                    path: middleware.route.path,
                    methods: Object.keys(middleware.route.methods)
                });
            } else if (middleware.name === 'router') {
                middleware.handle.stack.forEach(handler => {
                    if (handler.route) {
                        routes.push({
                            path: handler.route.path,
                            methods: Object.keys(handler.route.methods)
                        });
                    }
                });
            }
        });
        res.json(routes);
    });
}

// Version route
router.get('/version', (req, res) => {
    res.json({
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV
    });
});

export default router;
