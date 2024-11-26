// routes/subcategory.routes.js
import express from "express";
import {
  createSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoriesByCategory,
} from "../controllers/subcategory.js";
import { createUploadMiddleware } from "../middleware/multer.js";

const router = express.Router();

// Base route: /api/subcategories
router
  .route("/")
  .post(createUploadMiddleware.subcategory(), createSubcategory)
  .get(getSubcategories);

router
  .route("/:id")
  .get(getSubcategoryById)
  .put(createUploadMiddleware.subcategory(), updateSubcategory)
  .delete(deleteSubcategory);

// Special route for getting subcategories by category
router.get("/category/:categoryId", getSubcategoriesByCategory);

export default router;