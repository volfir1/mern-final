// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import morgan from "morgan";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { corsOptions } from "./config/cors.js";
import connectDatabase from "./config/database.js";
import apiRoutes from "./app.js";
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'CLIENT_URL',
  'API_URL',
  'FRONTEND_URL',
  'DB_URI',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const app = express();
let server;

// Find available port function
const findAvailablePort = async (startPort) => {
  const isPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer()
        .listen(port)
        .once('listening', () => {
          server.close();
          resolve(true);
        })
        .once('error', () => resolve(false));
    });
  };

  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
};

// Kill existing process on port (Windows)
const killPortProcess = async (port) => {
  if (process.platform === 'win32') {
    try {
      const { exec } = await import('child_process');
      await new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, async (error, stdout) => {
          if (!error && stdout) {
            const pid = stdout.split('\n')[0].split(' ').filter(Boolean).pop();
            if (pid) {
              await new Promise(resolve => exec(`taskkill /F /PID ${pid}`, resolve));
            }
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('Port killing error:', error);
    }
  }
};

// CORS setup
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Also add these headers explicitly
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Handle Stripe webhook route before body parsers
app.post('/api/webhook', express.raw({ type: 'application/json' }));

// Body parsing middleware for other routes
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
      next(); // Raw body for webhook
  } else {
      express.json()(req, res, next); // Parsed body for other routes
  }
});

app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Development request logging
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    if (req.originalUrl !== '/api/webhook') { // Skip logging webhook requests
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
  console.error("🔥 Server error:", {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Handle specific errors
  const errorHandlers = {
    ValidationError: () => ({
      status: 400,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(error => error.message)
    }),
    11000: () => ({
      status: 400,
      message: 'Duplicate field value entered'
    }),
    JsonWebTokenError: () => ({
      status: 401,
      message: 'Invalid token'
    }),
    StripeError: () => ({
      status: 400,
      message: err.message
    })
  };

  const errorResponse = errorHandlers[err.name] || errorHandlers[err.code] || (() => ({
    status: err.statusCode || 500,
    message: err.message || 'Internal Server Error'
  }));

  const { status, message, errors } = errorResponse();

  res.status(status).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('✅ HTTP server closed');
    }
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

// Server startup function
const startServer = async () => {
  try {
    await connectDatabase();
    
    const desiredPort = parseInt(process.env.PORT) || 3000;
    await killPortProcess(desiredPort);
    const availablePort = await findAvailablePort(desiredPort);

    server = app.listen(availablePort, () => {
      console.log(`
🚀 Server Status
------------------
✅ Server is running
🌍 Environment: ${process.env.NODE_ENV}
🚪 Port: ${availablePort}
🌐 Frontend URL: ${process.env.FRONTEND_URL}
🔗 Client URL: ${process.env.CLIENT_URL}
🛜 API URL: ${process.env.API_URL}
💳 Stripe Webhook Ready
------------------
      `);
    });

    // Error handling for server
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${availablePort} is busy, trying another port...`);
        server.close();
        startServer();
      } else {
        console.error('Server error:', error);
      }
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Process event handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! 💥', err);
  gracefulShutdown('UNHANDLED REJECTION');
});
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! 💥', err);
  gracefulShutdown('UNCAUGHT EXCEPTION');
});

// Start server
startServer().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export default app;