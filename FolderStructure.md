##Backend Folder structure

backend/
├── config/
│   ├── database.js        # MongoDB connection
│   └── multer.js         # File upload configuration
├── models/
│   ├── userAuth.js       # Your existing authentication model
│   └── userProfile.js    # New profile model
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── profileController.js # Profile management logic
├── middleware/
│   ├── auth.js           # JWT verification middleware
│   ├── errorHandler.js   # Global error handling
│   └── upload.js         # File upload middleware
├── routes/
│   ├── authRoutes.js     # Authentication routes
│   └── profileRoutes.js  # Profile management routes
├── utils/
│   ├── jwtToken.js       # Your existing JWT utilities
│   ├── catchAsync.js     # Async error wrapper
│   └── apiError.js       # Custom error class
├── uploads/              # Temporary storage for profile images
├── .env                  # Environment variables
├── .gitignore
├── package.json
└── server.js            # Entry point