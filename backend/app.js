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
import checkoutRoutes from './routes/checkout.js';
import { handleWebhook } from './controllers/payment.js';

// Import middleware
import { protect, securityHeaders } from "./middleware/auth.js";

const router = express.Router();

// Stripe webhook route first
router.post('/payments/webhook', express.raw({type: 'application/json'}), handleWebhook);

// Security middleware
router.use(securityHeaders);
router.use(helmet());
router.use(mongoSanitize());
router.use(xss());
router.use(hpp());

// Rate limiting
router.use('/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests'
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
router.use("/profile", profileRoutes);
router.use("/categories", categoryRoutes);
router.use("/categories/:categoryId/subcategories", subcategoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/users", userRoutes);
router.use('/checkout', checkoutRoutes);

export default router;