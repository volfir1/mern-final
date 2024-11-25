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
import Product from "../models/product.js";


const router = express.Router();
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Error caught by asyncHandler:', {
      endpoint: `${req.method} ${req.originalUrl}`,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });

    // Handle different types of errors
    switch (error.name) {
      case 'ValidationError':
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });

      case 'CastError':
        return res.status(400).json({
          success: false,
          message: `Invalid ${error.path}: ${error.value}`
        });

      default:
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
          const field = Object.keys(error.keyPattern)[0];
          return res.status(400).json({
            success: false,
            message: `Duplicate value for ${field}`
          });
        }

        // Default server error
        return res.status(500).json({
          success: false,
          message: process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'Internal Server Error'
        });
    }
  });
};
// ===== Public Routes =====
router.get("/", asyncHandler(getProducts));
router.get("/:id", asyncHandler(getProductById));
router.get("/search", asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  try {
    const searchRegex = new RegExp(query, 'i');

    const products = await Product.find({
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { category: { $regex: searchRegex } }
      ]
    })
    .select('_id name price images inStock')
    .limit(10)
    .lean();

    return res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search products'
    });
  }
}));
// Check product name availability
router.get("/check-name", asyncHandler(async (req, res) => {
  const { name, productId } = req.query;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Product name is required"
    });
  }

  const nameRegex = new RegExp(`^${name}$`, "i");
  const query = { name: nameRegex };
  
  if (productId) {
    query._id = { $ne: productId };
  }

  const existingProduct = await Product.findOne(query);

  return res.json({
    success: true,
    exists: !!existingProduct,
    message: existingProduct
      ? "Product name already exists"
      : "Product name is available",
  });
}));

// ===== Protected Routes =====
router.post(
  "/",
  protect,
  authorize("admin"),
  createUploadMiddleware.product(),
  asyncHandler(createProduct)
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  createUploadMiddleware.product(),
  asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    next();
  }),
  asyncHandler(updateProduct)
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    next();
  }),
  asyncHandler(deleteProduct)
);


export default router;