// models/subcategory.js
import mongoose from "mongoose";
import { DEFAULT_IMAGES } from '../utils/cloudinary.js';

// Custom slug generation function
const generateSlug = (name) => {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
};

const subcategorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Subcategory name is required'],
      trim: true,
      minlength: [2, 'Subcategory name must be at least 2 characters'],
      maxlength: [50, 'Subcategory name cannot exceed 50 characters']
    },
    description: { 
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, 'Parent category is required'],
      index: true
    },
    image: {
      url: {
        type: String,
        default: DEFAULT_IMAGES.CATEGORY
      },
      publicId: {
        type: String,
        default: null
      }
    },
    slug: {
      type: String,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    orderIndex: {
      type: Number,
      default: 0
    },
    metadata: {
      productCount: {
        type: Number,
        default: 0
      },
      lastProductAdded: {
        type: Date
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
subcategorySchema.index({ category: 1, name: 1 }, { unique: true });
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });
subcategorySchema.index({ isActive: 1 });
subcategorySchema.index({ orderIndex: 1 });

// Generate unique slug before saving
subcategorySchema.pre('save', async function(next) {
  try {
    if (this.isModified('name')) {
      // Create base slug
      let baseSlug = generateSlug(this.name);

      // Check if slug exists in the same category
      let slugExists = true;
      let slugCount = 0;
      let newSlug = baseSlug;

      while (slugExists) {
        if (slugCount > 0) {
          newSlug = `${baseSlug}-${slugCount}`;
        }
        
        const existingSubcategory = await this.constructor.findOne({ 
          category: this.category,
          slug: newSlug,
          _id: { $ne: this._id }
        });
        
        if (!existingSubcategory) {
          slugExists = false;
        } else {
          slugCount++;
        }
      }

      this.slug = newSlug;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Update category metadata after save
subcategorySchema.post('save', async function(doc) {
  try {
    const Category = mongoose.model('Category');
    const category = await Category.findById(doc.category);
    if (category) {
      await category.updateMetadata();
    }
  } catch (error) {
    console.error('Error updating category metadata:', error);
  }
});

// Virtual for all products
subcategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'subcategory',
  options: { sort: { createdAt: -1 } }
});

// Virtual for active products only
subcategorySchema.virtual('activeProducts', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'subcategory',
  match: { isActive: true },
  options: { sort: { createdAt: -1 } }
});

// Instance methods
subcategorySchema.methods = {
  async updateMetadata() {
    const productCount = await mongoose.model('Product').countDocuments({
      subcategory: this._id
    });
    
    const lastProduct = await mongoose.model('Product')
      .findOne({ subcategory: this._id })
      .sort({ createdAt: -1 });

    this.metadata = {
      productCount,
      lastProductAdded: lastProduct?.createdAt
    };

    await this.save();
  },

  async getFullDetails() {
    return await this.populate([
      {
        path: 'category',
        select: 'name slug'
      },
      {
        path: 'activeProducts',
        select: 'name slug price image isActive'
      }
    ]);
  }
};

// Static methods
subcategorySchema.statics = {
  async getWithProductCounts() {
    return await this.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'subcategory',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $project: {
          products: 0
        }
      }
    ]);
  },

  async findByCategory(categoryId) {
    return await this.find({ 
      category: categoryId,
      isActive: true 
    })
    .sort({ orderIndex: 1 })
    .populate('activeProducts');
  }
};

// Middleware for cascade operations
subcategorySchema.pre('remove', async function(next) {
  try {
    // Update products that reference this subcategory
    await mongoose.model('Product').updateMany(
      { subcategory: this._id },
      { $unset: { subcategory: 1 } }
    );

    // Update parent category metadata
    const Category = mongoose.model('Category');
    const category = await Category.findById(this.category);
    if (category) {
      await category.updateMetadata();
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

export default Subcategory;