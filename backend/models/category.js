// models/category.js
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

const categorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: { 
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
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
      unique: true,
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
      subcategoryCount: {
        type: Number,
        default: 0
      },
      productCount: {
        type: Number,
        default: 0
      },
      lastSubcategoryAdded: {
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
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ orderIndex: 1 });

// Generate slug before saving
categorySchema.pre('save', async function(next) {
  try {
    if (this.isModified('name')) {
      // Create base slug
      let baseSlug = generateSlug(this.name);

      // Check if slug exists
      let slugExists = true;
      let slugCount = 0;
      let newSlug = baseSlug;

      while (slugExists) {
        if (slugCount > 0) {
          newSlug = `${baseSlug}-${slugCount}`;
        }
        
        const existingCategory = await this.constructor.findOne({ 
          slug: newSlug,
          _id: { $ne: this._id }
        });
        
        if (!existingCategory) {
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

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Subcategory',
  localField: '_id',
  foreignField: 'category',
  options: { sort: { orderIndex: 1 } }
});

// Virtual for active subcategories
categorySchema.virtual('activeSubcategories', {
  ref: 'Subcategory',
  localField: '_id',
  foreignField: 'category',
  match: { isActive: true },
  options: { sort: { orderIndex: 1 } }
});

// Instance methods
categorySchema.methods = {
  async updateMetadata() {
    const subcategoryCount = await mongoose.model('Subcategory').countDocuments({
      category: this._id
    });
    
    const productCount = await mongoose.model('Product').countDocuments({
      category: this._id
    });
    
    const lastSubcategory = await mongoose.model('Subcategory')
      .findOne({ category: this._id })
      .sort({ createdAt: -1 });

    this.metadata = {
      subcategoryCount,
      productCount,
      lastSubcategoryAdded: lastSubcategory?.createdAt
    };

    await this.save();
  },

  async getSubcategoryTree() {
    return await this.populate({
      path: 'subcategories',
      select: 'name slug image isActive orderIndex',
      populate: {
        path: 'products',
        select: 'name slug price'
      }
    });
  }
};

// Static methods
categorySchema.statics = {
  async getWithSubcategoryCounts() {
    return await this.aggregate([
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'category',
          as: 'subcategories'
        }
      },
      {
        $addFields: {
          subcategoryCount: { $size: '$subcategories' }
        }
      },
      {
        $project: {
          subcategories: 0
        }
      }
    ]);
  },

  async getActiveWithSubcategories() {
    return await this.find({ isActive: true })
      .populate({
        path: 'activeSubcategories',
        select: 'name slug image isActive'
      })
      .sort({ orderIndex: 1 });
  }
};

// Middleware for cascade operations
categorySchema.pre('remove', async function(next) {
  try {
    await mongoose.model('Subcategory').deleteMany({ category: this._id });
    await mongoose.model('Product').updateMany(
      { category: this._id },
      { $unset: { category: 1 } }
    );
    next();
  } catch (error) {
    next(error);
  }
});

const Category = mongoose.model("Category", categorySchema);

export default Category;