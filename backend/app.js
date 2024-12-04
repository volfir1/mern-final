// app.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss-clean';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import profileRoutes from './routes/profile.js';
import categoryRoutes from './routes/category.js';
import subcategoryRoutes from './routes/subcategory.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import paymentRoutes from './routes/payment.js';
import supplierRoutes from './routes/supplier.js';
import userRoutes from './routes/user.js';
import checkoutRoutes from './routes/checkout.js';
import reviewRoutes from './routes/reviews.js';

// Import middleware
import { protect, securityHeaders } from './middleware/auth.js';
import { handleWebhook } from './controllers/payment.js';

// Import models to ensure they are registered
import './models/userAuth.js';      // Registers "User"
import './models/product.js';   // Registers "Product"
import './models/reviews.js';    // Registers "Review"
// Import other models as necessary

const router = express.Router();

// Stripe webhook route first (raw body)
router.post('/payments/webhook', express.raw({type: 'application/json'}), handleWebhook);

// Security middleware
router.use(securityHeaders);
router.use(helmet());
router.use(mongoSanitize());
router.use(xss());
router.use(hpp());

// Rate limiting for auth routes
router.use('/auth', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
}));

// Health & docs routes
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

router.get('/docs', (req, res) => {
    res.redirect(process.env.API_DOCS_URL || '/api-docs');
});

// Routes mounting
router.use("/auth", authRoutes);
router.use(protect); // Protected routes below

router.use("/products", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/profile", profileRoutes);
router.use("/categories", categoryRoutes);
router.use("/categories/:categoryId/subcategories", subcategoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/users", userRoutes);
router.use('/checkout', checkoutRoutes);

// 404 handler
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
router.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Process handlers
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

export default router;
