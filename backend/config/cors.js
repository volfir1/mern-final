// config/cors.js

const allowedOrigins = [
  'http://localhost:5175',    // Vite default
  'http://localhost:3000',    // Backend port
  'http://localhost:5173',    // Vite preview port
  'https://accounts.google.com', // Google auth
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  // Add any additional origins you need
].filter(Boolean); // Remove falsy values

// Debug helper with timestamp
const debugCors = (message, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CORS ${new Date().toISOString()}] ${message}:`, data);
  }
};

// Helper to check if origin is a Google-related domain
const isGoogleDomain = (origin) => {
  return origin?.includes('accounts.google.com') || 
         origin?.endsWith('.firebaseapp.com') || 
         origin?.endsWith('.web.app');
};

export const corsOptions = {
  origin: (origin, callback) => {
    debugCors('Request origin', origin);

    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) {
      debugCors('Allowing null origin request');
      return callback(null, true);
    }

    // Always allow Google domains
    if (isGoogleDomain(origin)) {
      debugCors('Allowing Google domain', origin);
      return callback(null, true);
    }

    // Check if the origin is in our allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      // Handle potential undefined values
      if (!allowed) return false;
      // Exact match
      if (allowed === origin) return true;
      // Handle wildcard subdomains
      if (allowed.startsWith('*.') && origin.endsWith(allowed.slice(1))) return true;
      return false;
    });

    if (isAllowed) {
      debugCors('Allowing origin', origin);
      callback(null, true);
    } else {
      debugCors('Blocking origin', origin);
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'X-Firebase-Auth'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Authorization',
    'X-Firebase-Auth'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Enhanced Google Auth CORS middleware
export const googleAuthCors = (req, res, next) => {
  const origin = req.headers.origin;
  debugCors('Google Auth request', {
    origin,
    method: req.method,
    path: req.path
  });

  // Check if it's actually a Google-related request
  if (isGoogleDomain(origin) || req.path.includes('/auth/google')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    res.header('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));

    if (req.method === 'OPTIONS') {
      debugCors('Handling Google Auth preflight');
      return res.sendStatus(204);
    }
  }

  next();
};

// Enhanced CORS debugger
export const corsDebugger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('\n[CORS Debug Info]', new Date().toISOString());
    console.log({
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      auth: !!req.headers.authorization,
      cookies: !!req.headers.cookie,
      'user-agent': req.headers['user-agent']
    });
  }
  next();
};

// Enhanced security headers middleware
export const securityHeaders = (req, res, next) => {
  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Ensure proper CORS credentials
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Special handling for OPTIONS
  if (req.method === 'OPTIONS') {
    if (req.headers.origin && (allowedOrigins.includes(req.headers.origin) || isGoogleDomain(req.headers.origin))) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  
  next();
};

// Enhanced CORS error handler
export const corsErrorHandler = (err, req, res, next) => {
  if (err.message.includes('CORS')) {
    const errorInfo = {
      error: 'CORS Error',
      message: err.message,
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    };

    debugCors('Error', errorInfo);
    
    return res.status(403).json({
      ...errorInfo,
      allowedOrigins: process.env.NODE_ENV === 'development' ? allowedOrigins : undefined,
      suggestion: 'If this is unexpected, check your environment variables and CORS configuration.'
    });
  }
  next(err);
};