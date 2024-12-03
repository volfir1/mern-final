// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from 'cookie-parser';
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import apiRoutes from "./app.js";

// Environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Validate required env vars
const requiredEnvVars = ['NODE_ENV', 'CLIENT_URL', 'DB_URI'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`❌ Missing ${envVar}`);
        process.exit(1);
    }
});

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Body parsing middleware
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        if (req.originalUrl !== '/api/webhook') {
            console.log(`📨 ${req.method} ${req.url}`);
            if (Object.keys(req.query).length > 0) {
                console.log('Query Params:', req.query);
            }
            if (Object.keys(req.body).length > 0) {
                console.log('Request Body:', req.body);
            }
        }
        next();
    });
}

// Mount routes
app.use("/api", apiRoutes);

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Enhanced error handler
app.use((err, req, res, next) => {
    console.error("🔥 Error:", {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    try {
        await mongoose.connection.close();
        console.log("📦 Database connection closed.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error during graceful shutdown:", err);
        process.exit(1);
    }
};

// Database connection and server startup
const startServer = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("📦 Database connected successfully");

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`
🚀 Server Running
----------------
🌐 Port: ${PORT}
🔧 Mode: ${process.env.NODE_ENV}
🔗 Frontend: ${process.env.CLIENT_URL}
----------------`);
        });
    } catch (err) {
        console.error("❌ Server startup failed:", err);
        process.exit(1);
    }
};

// Process event handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
    console.error("❌ Uncaught Exception:", err);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    console.error("❌ Unhandled Rejection:", err);
    process.exit(1);
});

// Start server
startServer();

export default app;