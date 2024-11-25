// routes/category.js
import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { createUploadMiddleware } from "../middleware/multer.js";
import { createCategoryValidation, updateCategoryValidation } from '../middleware/validation.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getCategories)
  .post(
    authorize('admin'),
    createUploadMiddleware.category(), // Uses the category config from your multer setup
    createCategoryValidation,
    createCategory
  );

router
  .route("/:id")
  .get(getCategoryById)
  .put(
    authorize('admin'),
    createUploadMiddleware.category(),
    updateCategoryValidation,
    updateCategory
  )
  .delete(
    authorize('admin'),
    deleteCategory
  );

export default router;