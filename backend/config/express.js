// config/express.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { corsOptions } from './cors.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import routes from '../app.js';
import { HandleMulterError } from '../middleware/multer.js';

// Debug middleware
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
};

export default () => {
  const app = express();

  // Basic middleware
  app.use(bodyParser.json({ 
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  }));
  app.use(bodyParser.urlencoded({ 
    extended: true, 
    limit: "10mb" 
  }));
  app.use(cookieParser());
  
  // CORS should be before routes
  app.use(cors(corsOptions));

  // Development logging
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
    app.use(requestLogger);
  }

  // Health check route
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });

  // API routes
  app.use('/api', routes);

  // Error Handling (should be last)
  app.use(HandleMulterError);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};