  // models/cart.js
  import mongoose from "mongoose";

  const cartItemSchema = new mongoose.Schema({
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity cannot be less than 1'],
      default: 1
    },
    image: {
      type: String,
      required: true
    },
    subtotal: {
      type: Number,
      default: function() {
        return this.price * this.quantity;
      }
    }
  }, { timestamps: true });

  const cartSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [cartItemSchema],
    total: {
      type: Number,
      default: 0
    },
    itemCount: {
      type: Number,
      default: 0
    }
  }, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  // Pre-save middleware to calculate totals
  cartSchema.pre('save', function(next) {
    this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    next();
  });

  // Instance methods
  cartSchema.methods = {
    async addItem(productId, quantity = 1) {
      try {
        console.log('Adding item to cart:', { productId, quantity });
        
        // Find product and validate
        const product = await mongoose.model('Product').findById(productId);
        if (!product) throw new Error('Product not found');
        if (!product.inStock) throw new Error('Product out of stock');
        if (product.stockQuantity < quantity) throw new Error('Not enough stock available');

        // Get default image
        const defaultImage = product.images.find(img => img.isDefault) || product.images[0];
        
        const existingItemIndex = this.items.findIndex(item => 
          item.product.toString() === productId.toString()
        );

        console.log('Existing item index:', existingItemIndex);

        if (existingItemIndex > -1) {
          // Update existing item
          const newQuantity = this.items[existingItemIndex].quantity + quantity;
          if (newQuantity > product.stockQuantity) {
            throw new Error('Not enough stock available');
          }
          
          this.items[existingItemIndex].quantity = newQuantity;
          this.items[existingItemIndex].subtotal = product.price * newQuantity;
        } else {
          // Add new item
          this.items.push({
            product: productId,
            name: product.name,
            price: product.price,
            quantity,
            image: defaultImage.url,
            subtotal: product.price * quantity
          });
        }

        const savedCart = await this.save();
        console.log('Cart saved successfully:', savedCart);
        return savedCart;
      } catch (error) {
        console.error('Error in addItem:', error);
        throw error;
      }
    },

    async updateItemQuantity(productId, quantity) {
      try {
        console.log('Updating cart item quantity:', { productId, quantity });
        
        // Validate product
        const product = await mongoose.model('Product').findById(productId);
        if (!product) throw new Error('Product not found');
        if (!product.inStock) throw new Error('Product out of stock');
        if (product.stockQuantity < quantity) throw new Error('Not enough stock available');

        // Find item in cart
        const itemIndex = this.items.findIndex(item => 
          item.product.toString() === productId.toString()
        );
        
        console.log('Item index in cart:', itemIndex);
        
        if (itemIndex === -1) throw new Error('Item not found in cart');

        // Update item quantity
        this.items[itemIndex].quantity = quantity;
        this.items[itemIndex].subtotal = this.items[itemIndex].price * quantity;
        
        const savedCart = await this.save();
        console.log('Cart updated successfully:', savedCart);
        return savedCart;
      } catch (error) {
        console.error('Error in updateItemQuantity:', error);
        throw error;
      }
    },

    async removeItem(productId) {
      try {
        console.log('Removing item from cart:', productId);
        
        const initialLength = this.items.length;
        this.items = this.items.filter(item => 
          item.product.toString() !== productId.toString()
        );
        
        if (this.items.length === initialLength) {
          throw new Error('Item not found in cart');
        }

        const savedCart = await this.save();
        console.log('Item removed successfully:', savedCart);
        return savedCart;
      } catch (error) {
        console.error('Error in removeItem:', error);
        throw error;
      }
    },

    async clear() {
      try {
        console.log('Clearing cart');
        this.items = [];
        const savedCart = await this.save();
        console.log('Cart cleared successfully:', savedCart);
        return savedCart;
      } catch (error) {
        console.error('Error in clear:', error);
        throw error;
      }
    },

    async validateStock() {
      try {
        console.log('Validating stock for cart items');
        const invalidItems = [];
        
        for (const item of this.items) {
          const product = await mongoose.model('Product').findById(item.product);
          if (!product || !product.inStock || product.stockQuantity < item.quantity) {
            invalidItems.push(item.product);
          }
        }
        
        console.log('Invalid items:', invalidItems);
        return invalidItems;
      } catch (error) {
        console.error('Error in validateStock:', error);
        throw error;
      }
    }
  };

  // Static methods
  cartSchema.statics = {
    async getCartByUser(userId) {
      try {
        console.log('Getting cart for user:', userId);
        const cart = await this.findOne({ user: userId })
          .populate({
            path: 'items.product',
            select: 'name price images inStock stockQuantity slug'
          });
        console.log('Found cart:', cart);
        return cart;
      } catch (error) {
        console.error('Error in getCartByUser:', error);
        throw error;
      }
    }
  };

  const Cart = mongoose.model('Cart', cartSchema);
  export default Cart;