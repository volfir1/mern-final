import mongoose from "mongoose";

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
          if (!val) return true;
          return this.isNew ? val > this.price : val > (this.price || this.getUpdate()?.$set?.price);
        },
        message: 'Compare at price must be greater than regular price'
      }
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
    
    // Stock Management
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

    // Categories
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, 'Category is required'],
      index: true
    },
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

    // Supplier Integration
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      index: true
    },
    supplierInfo: {
      price: {
        type: Number,
        min: [0, 'Supplier price cannot be negative'],
        set: val => Math.round(val * 100) / 100
      },
      stockQuantity: {
        type: Number,
        min: [0, 'Supplier stock quantity cannot be negative']
      },
      sku: {
        type: String,
        trim: true
      },
      status: {
        type: String,
        enum: ['active', 'discontinued', 'pending'],
        default: 'active'
      },
      lastOrderDate: Date,
      nextDeliveryDate: Date,
      minimumOrderQuantity: {
        type: Number,
        min: 0,
        default: 1
      },
      leadTime: {
        type: Number,
        min: 0,
        default: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },

    // Images
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

    // Additional Info
    tags: [{
      type: String,
      trim: true
    }],
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

    // Status and Features
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
    
    // Pricing and SKU
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
    },

    // Metadata
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
      },
      rating: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 5
      },
      ratingCount: {
        type: Number,
        default: 0,
        min: 0
      }
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
productSchema.index({ category: 1, subcategories: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ supplier: 1, 'supplierInfo.sku': 1 });

// Middleware
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

    // Validate compare price
    if (this.compareAtPrice && this.compareAtPrice <= this.price) {
      throw new Error('Compare at price must be greater than regular price');
    }

    // Validate supplier info
    if (this.supplier && (!this.supplierInfo || !this.supplierInfo.price)) {
      throw new Error('Supplier information is required when a supplier is assigned');
    }

    // Update supplier info timestamp
    if (this.isModified('supplierInfo')) {
      this.supplierInfo.lastUpdated = new Date();
    }

    // Update stock status
    this.inStock = this.stockQuantity > 0;

    // Calculate discount
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

// Instance methods
productSchema.methods = {
  async updateSupplierInfo(supplierData) {
    this.supplierInfo = {
      ...this.supplierInfo,
      ...supplierData,
      lastUpdated: new Date()
    };
    return this.save();
  },

  async assignSupplier(supplierId, supplierData) {
    this.supplier = supplierId;
    if (supplierData) {
      this.supplierInfo = {
        ...supplierData,
        lastUpdated: new Date()
      };
    }
    return this.save();
  },

  async removeSupplier() {
    this.supplier = null;
    this.supplierInfo = null;
    return this.save();
  },

  getDefaultImage() {
    return this.images.find(img => img.isDefault) || this.images[0];
  },

  incrementViews() {
    this.metadata.views += 1;
    this.metadata.lastViewed = new Date();
    return this.save();
  }
};

// Static methods
productSchema.statics = {
  async getFeatured() {
    return this.find({ isActive: true, isFeatured: true })
      .populate('category subcategories supplier')
      .sort('-createdAt');
  },

  async getBySupplier(supplierId) {
    return this.find({ 
      supplier: supplierId,
      isActive: true 
    })
    .populate('supplier category subcategories')
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

    if (filters.supplier) searchQuery.supplier = filters.supplier;
    if (filters.category) searchQuery.category = filters.category;
    if (filters.subcategories) searchQuery.subcategories = { $in: filters.subcategories };
    if (filters.minPrice) searchQuery.price = { $gte: filters.minPrice };
    if (filters.maxPrice) searchQuery.price = { ...searchQuery.price, $lte: filters.maxPrice };
    if (filters.inStock) searchQuery.inStock = true;

    return this.find(searchQuery)
      .populate('category subcategories supplier')
      .sort(filters.sort || '-createdAt');
  }
};

// Virtuals
productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity > 0 && this.stockQuantity <= this.lowStockThreshold;
});

productSchema.virtual('supplierDetails', {
  ref: 'Supplier',
  localField: 'supplier',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product'
});

const Product = mongoose.model("Product", productSchema);

export default Product;