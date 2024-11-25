// controllers/cartController.js
import Cart from '../models/cart.js';
import Product from '../models/product.js';

export const getCart = async (req, res) => {
  try {
    console.log('Getting cart for user:', req.user.id);
    
    // Use the static method from schema
    let cart = await Cart.getCartByUser(req.user.id);

    if (!cart) {
      console.log('No cart found, creating new cart');
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    console.log('Add to cart request:', { userId: req.user.id, productId, quantity });

    // Input validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      console.log('Creating new cart for user');
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }

    // Use schema method to add item
    await cart.addItem(productId, quantity);
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCartItem = async (req, res) => {
    try {
      const { productId } = req.params;  // Get productId from URL params now
      const { quantity } = req.body;
      
      console.log('Update cart request:', {
        userId: req.user.id,
        productId,
        quantity,
        params: req.params,
        body: req.body
      });
  
      if (!productId || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and quantity are required'
        });
      }
  
      const cart = await Cart.findOne({ user: req.user.id });
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }
  
      // Try to find the item in the cart
      const itemExists = cart.items.some(item => 
        item.product.toString() === productId.toString()
      );
  
      if (!itemExists) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }
  
      await cart.updateItemQuantity(productId, quantity);
      await cart.populate('items.product');
  
      console.log('Cart updated successfully:', cart);
  
      res.status(200).json({
        success: true,
        message: 'Cart updated',
        data: cart
      });
    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('Remove cart item request:', { userId: req.user.id, productId });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Use schema method to remove item
    await cart.removeItem(productId);
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    console.log('Clear cart request for user:', req.user.id);
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Use schema method to clear cart
    await cart.clear();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};