// routes/cart.js
import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from "../controllers/cart.js";

const router = express.Router();

// Protect all cart routes
router.use(protect);
router.use(authorize('user')); 

// Route: GET /api/cart
router.get('/', getCart);

// Route: POST /api/cart
router.post('/', addToCart);

// Route: PUT /api/cart/items/:productId
router.put('/items/:productId', updateCartItem);

// Route: DELETE /api/cart/items/:productId
router.delete('/items/:productId', removeCartItem);

// Route: DELETE /api/cart/clear
router.delete('/clear', clearCart);

export default router;