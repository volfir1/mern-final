import express from 'express';
import multer from 'multer';
import {
  createSupplier,
  getSupplierByID,
  updateSupplier,
  deleteSupplier,
  getSuppliers,
  addProductToSupplier,
  removeProductFromSupplier,
  updateSupplierInventory,
} from "../controllers/supplier.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// ===== Multer Configuration =====
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ===== Error Handling Middleware for Multer =====
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

// ===== Public Routes =====
router.get('/', getSuppliers); // Get all suppliers
router.get('/:id', getSupplierByID); // Get a single supplier by ID

// ===== Admin-Protected Routes =====
router.post(
  '/',
  protect, // Require authentication
  authorize('admin'), // Restrict to admin users
  upload.single('image'), // Handle image upload
  handleMulterError, // Handle Multer errors
  createSupplier
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  handleMulterError,
  updateSupplier
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteSupplier
);

// ===== Product Management Routes =====
router.post(
  '/:id/products',
  protect,
  authorize('admin'),
  addProductToSupplier
);

router.delete(
  '/:id/products',
  protect,
  authorize('admin'),
  removeProductFromSupplier
);

// ===== Inventory Management Routes =====
router.put(
  '/:id/inventory',
  protect,
  authorize('admin'),
  updateSupplierInventory
);

export default router;
