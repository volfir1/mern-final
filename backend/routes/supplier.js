// routes/supplier.js
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
    updateSupplierInventory
} from "../controllers/supplier.js";

const router = express.Router();

// Configure multer for image upload
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
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File is too large. Maximum size is 5MB'
            });
        }
        return res.status(400).json({
            message: err.message
        });
    }
    if (err) {
        return res.status(400).json({
            message: err.message
        });
    }
    next();
};

// Basic supplier routes
router.route('/')
    .get(getSuppliers)
    .post(upload.single('image'), handleMulterError, createSupplier);

router.route('/:id')
    .get(getSupplierByID)
    .put(upload.single('image'), handleMulterError, updateSupplier)
    .delete(deleteSupplier);

// Product management routes
router.route('/:id/products')
    .post(addProductToSupplier)
    .delete(removeProductFromSupplier);

// Inventory management route
router.route('/:id/inventory')
    .put(updateSupplierInventory);

export default router;