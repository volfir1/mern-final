// server.js
import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import morgan from "morgan";
import cookieParser from 'cookie-parser';
import { createRequire } from 'module';
import { corsOptions } from "./config/cors.js";
import connectDatabase from "./config/database.js";
import apiRoutes from "./app.js";

// Initial Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/.env` });

const app = express();

// Middleware Setup
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Development logging
if (process.env.NODE_ENV === "development") {
 app.use(morgan('dev'));
}

// Mount API routes
app.use("/api", apiRoutes);

// 404 Handler
app.all('*', (req, res) => {
 res.status(404).json({
   success: false,
   message: `Route ${req.originalUrl} not found`
 });
});

// Enhanced Global Error Handler
app.use((err, req, res, next) => {
 console.error("Server error:", {
   message: err.message,
   stack: err.stack,
   status: err.status,
   statusCode: err.statusCode,
   name: err.name,
   code: err.code
 });

 if (err.name === 'MulterError') {
   return res.status(400).json({
     status: 'error', 
     message: 'File upload error',
     error: {
       code: err.code,
       field: err.field,
       message: err.message
     }
   });
 }

 if (err.name === 'ValidationError') {
   return res.status(400).json({
     status: 'error',
     message: 'Validation Error', 
     errors: Object.values(err.errors).map(e => ({
       field: e.path,
       message: e.message
     }))
   });
 }

 const statusCode = err.statusCode || 500;
 const status = err.status || 'error';

 res.status(statusCode).json({
   status,
   message: err.message || 'Internal Server Error',
   ...(process.env.NODE_ENV === 'development' && {
     stack: err.stack,
     error: err
   })
 });
});

// Port finding utility
const findAvailablePort = async (startPort = 3000, maxAttempts = 10) => {
 const net = await import('net');

 const tryPort = (port) => {
   return new Promise((resolve, reject) => {
     const server = net.createServer();
     server.unref();
     server.on('error', reject);
     server.listen(port, () => {
       server.close(() => resolve(port));
     });
   });
 };

 for (let port = startPort; port < startPort + maxAttempts; port++) {
   try {
     return await tryPort(port);
   } catch (err) {
     if (err.code !== 'EADDRINUSE') throw err;
     continue;
   }
 }

 throw new Error(`No available ports found after ${maxAttempts} attempts`);
};

// Enhanced Server startup
const startServer = async () => {
 try {
   await connectDatabase();
   const port = await findAvailablePort(process.env.PORT || 3000);

   const server = app.listen(port, () => {
     console.log(`
🚀 Server running in ${process.env.NODE_ENV} mode
📡 Port: ${port}
🌐 URL: http://localhost:${port}
     `);
   });

   // Graceful shutdown handler
   const shutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    try {
        await new Promise((resolve) => {
            const serverClose = server.close(() => {
                console.log('Server closed successfully');
                resolve();
            });
            setTimeout(() => {
                console.log('Forcing shutdown...');
                resolve();
            }, 5000);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

   process.on('SIGTERM', () => shutdown('SIGTERM'));
   process.on('SIGINT', () => shutdown('SIGINT'));

   process.on('unhandledRejection', (err) => {
     console.error('Unhandled Rejection:', err);
     shutdown('UNHANDLED REJECTION');
   });

   process.on('uncaughtException', (err) => {
     console.error('Uncaught Exception:', err);
     shutdown('UNCAUGHT EXCEPTION');
   });

 } catch (error) {
   console.error("Failed to start server:", error);
   process.exit(1);
 }
};

startServer();

export default app;