import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.js";
import { protect, authorize } from "../middleware/auth.js";
import { createUploadMiddleware } from "../middleware/multer.js";
import Product from "../models/product.js";  // Make sure to import your Product model

const router = express.Router();

// Public routes
router.get("/", getProducts);  // Remove protect and authorize from here
router.get("/:id", getProductById);

// Check product name availability route
router.get('/check-name', async (req, res) => {
  try {
    const { name, productId } = req.query;
    const nameRegex = new RegExp(`^${name}$`, 'i');
    
    const query = { name: nameRegex };
    if (productId) {
      query._id = { $ne: productId };
    }
    
    const existingProduct = await Product.findOne(query);
    
    return res.json({
      exists: !!existingProduct,
      message: existingProduct 
        ? 'Product name already exists' 
        : 'Product name is available'
    });
  } catch (error) {
    console.error('Error checking product name:', error);
    return res.status(500).json({
      exists: false,
      message: 'Error checking product name'
    });
  }
});

// Protected admin routes
router.post("/", 
  // protect,                              // Authentication middleware
  // authorize('admin'),                   // Authorization middleware
  createUploadMiddleware.product(),     // Upload middleware
  createProduct
);

router.put("/:id",
  protect,
  authorize('admin'),
  createUploadMiddleware.product(),
  updateProduct
);

router.delete("/:id",
  protect,
  authorize('admin'),
  deleteProduct
);

export default router;