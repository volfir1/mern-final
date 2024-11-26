// models/product.js
import mongoose from "mongoose";
import { DEFAULT_IMAGES } from '../utils/cloudinary.js';

// Custom function to generate slug
const generateSlug = (name) => {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      set: val => Math.round(val * 100) / 100
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative'],
      validate: {
        validator: function(val) {
          // If no compare price is set, validation passes
          if (!val) return true;
          
          // During document creation
          if (this.isNew) {
            return val > this.price;
          }
          
          // During document update - get the current price
          const currentPrice = this.price || 
                             (this.getUpdate && this.getUpdate().$set && this.getUpdate().$set.price);
          
          return val > (currentPrice || this.price);
        },
        message: 'Compare at price must be greater than regular price'
      }
    },
    rating: { 
      type: Number, 
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    inStock: { 
      type: Boolean, 
      default: false 
    },
    stockQuantity: { 
      type: Number, 
      default: 0,
      min: [0, 'Stock quantity cannot be negative']
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, 'Category is required'],
      index: true
    },
    // Changed to array of subcategories
    subcategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      validate: {
        validator: async function(subcategoryId) {
          const subcategory = await mongoose.model('Subcategory').findById(subcategoryId);
          return subcategory && subcategory.category.equals(this.category);
        },
        message: 'Subcategory must belong to the selected category'
      }
    }],
    images: [{
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      },
      isDefault: {
        type: Boolean,
        default: false
      },
      sortOrder: {
        type: Number,
        default: 0
      }
    }],
    tags: [{
      type: String,
      trim: true
    }],
    metadata: {
      views: {
        type: Number,
        default: 0
      },
      sales: {
        type: Number,
        default: 0
      },
      lastSold: Date,
      lastViewed: Date,
      subcategoryCount: {
        type: Number,
        default: 0
      }
    },
    specifications: [{
      name: {
        type: String,
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    discountPercentage: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
productSchema.index({ name: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ category: 1, 'subcategories': 1 }); // Updated index
productSchema.index({ tags: 1 });
productSchema.index({ sku: 1 });

// Add this pre-save middleware to ensure validation on updates


productSchema.pre('save', function(next) {
  if (this.compareAtPrice && this.price && this.compareAtPrice <= this.price) {
    return next(new Error('Compare at price must be greater than regular price'));
  }
  next();
});
// Add this for handling updates

productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$set) {
    const { compareAtPrice, price } = update.$set;
    if (compareAtPrice !== undefined && price !== undefined && compareAtPrice <= price) {
      return next(new Error('Compare at price must be greater than regular price'));
    }
  }
  next();
});
// Pre-save middleware
productSchema.pre('save', async function(next) {
  try {
    // Generate slug
    if (this.isModified('name')) {
      let baseSlug = generateSlug(this.name);
      let slugExists = true;
      let slugCount = 0;
      let newSlug = baseSlug;

      while (slugExists) {
        if (slugCount > 0) {
          newSlug = `${baseSlug}-${slugCount}`;
        }
        
        const existingProduct = await this.constructor.findOne({ 
          slug: newSlug,
          _id: { $ne: this._id }
        });
        
        if (!existingProduct) {
          slugExists = false;
        } else {
          slugCount++;
        }
      }

      this.slug = newSlug;
    }

    // Validate images
    if (!this.images || this.images.length === 0) {
      throw new Error('At least one product image is required');
    }

    // Ensure only one default image
    const defaultImages = this.images.filter(img => img.isDefault);
    if (defaultImages.length === 0) {
      this.images[0].isDefault = true;
    } else if (defaultImages.length > 1) {
      this.images.forEach((img, index) => {
        img.isDefault = index === 0;
      });
    }

    // Sort images by sortOrder
    this.images.sort((a, b) => a.sortOrder - b.sortOrder);

    // Update stock status
    this.inStock = this.stockQuantity > 0;

    // Calculate discount if compareAtPrice exists
    if (this.compareAtPrice && this.compareAtPrice > this.price) {
      this.discountPercentage = Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
    }

    // Update metadata
    this.metadata.subcategoryCount = this.subcategories?.length || 0;

    next();
  } catch (error) {
    next(error);
  }
});

// Virtuals
productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity > 0 && this.stockQuantity <= this.lowStockThreshold;
});

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product'
});

// Instance methods
productSchema.methods = {
  async updateMetadata() {
    this.metadata.subcategoryCount = this.subcategories?.length || 0;
    await this.save();
  },

  getDefaultImage() {
    return this.images.find(img => img.isDefault) || this.images[0];
  },

  incrementViews() {
    this.metadata.views += 1;
    this.metadata.lastViewed = new Date();
    return this.save();
  },

  async updateImages(newImages) {
    // Sort images by sortOrder
    this.images = newImages.sort((a, b) => a.sortOrder - b.sortOrder);
    return this.save();
  }
};

// Static methods
productSchema.statics = {
  async getFeatured() {
    return this.find({ isActive: true, isFeatured: true })
      .populate('category subcategories')
      .sort('-createdAt');
  },

  async getByCategory(categoryId) {
    return this.find({ 
      category: categoryId,
      isActive: true 
    })
    .populate('subcategories')
    .sort('-createdAt');
  },

  async getBySubcategory(subcategoryId) {
    return this.find({ 
      subcategories: subcategoryId,
      isActive: true 
    })
    .populate('category subcategories')
    .sort('-createdAt');
  },

  async search(query, filters = {}) {
    const searchQuery = {
      $and: [
        { isActive: true },
        {
          $or: [
            { name: new RegExp(query, 'i') },
            { description: new RegExp(query, 'i') },
            { tags: new RegExp(query, 'i') }
          ]
        }
      ]
    };

    // Add filters
    if (filters.category) searchQuery.category = filters.category;
    if (filters.subcategories) searchQuery.subcategories = { $in: filters.subcategories };
    if (filters.minPrice) searchQuery.price = { $gte: filters.minPrice };
    if (filters.maxPrice) searchQuery.price = { ...searchQuery.price, $lte: filters.maxPrice };
    if (filters.inStock) searchQuery.inStock = true;

    return this.find(searchQuery)
      .populate('category subcategories')
      .sort(filters.sort || '-createdAt');
  }
};

const Product = mongoose.model("Product", productSchema);

export default Product;