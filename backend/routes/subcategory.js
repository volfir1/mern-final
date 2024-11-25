// routes/subcategory.js
import express from "express";
import {
  createSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoriesByCategory,
} from "../controllers/subcategory.js";
import { protect, authorize } from "../middleware/auth.js";
import { createUploadMiddleware } from "../middleware/multer.js";

const router = express.Router({ mergeParams: true }); // Important: add mergeParams

router.route('/')
  .get(getSubcategories)
  .post(
    protect,
    authorize("admin"),
    createUploadMiddleware.subcategory(),
    createSubcategory
  );

router.route('/:id')
  .get(getSubcategoryById)
  .put(
    protect,
    authorize("admin"),
    createUploadMiddleware.subcategory(),
    updateSubcategory
  )
  .delete(protect, authorize("admin"), deleteSubcategory);

export default router;