// routes/category.routes.js
import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.js";
import { createUploadMiddleware } from "../middleware/multer.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Base route: /api/categories
router
  .route("/")
  .post(
    createUploadMiddleware.category(), // Uses single upload for category image
    createCategory
  )
  .get(getCategories);
  // protect,
  // authorize('admin'),

router
  .route("/:id")
  .get(getCategoryById)
  .put(
    createUploadMiddleware.category(), // Same configuration for updates
    updateCategory
  )
  .delete(deleteCategory);

export default router;
