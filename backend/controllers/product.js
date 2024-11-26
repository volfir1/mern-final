// controllers/product.controller.js
import Product from "../models/product.js";
import mongoose from "mongoose";
import { 
  uploadImage, 
  deleteImage, 
  CLOUDINARY_FOLDERS, 
  checkImageExists,
  IMAGE_TRANSFORMATIONS 
} from '../utils/cloudinary.js';

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */

const createCleanName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};


export const createProduct = async (req, res) => {
  let uploadedImages = [];

  try {
    const {
      name,
      price,
      description,
      inStock,
      stock,
      category,
      subcategories,
      tags,
      specifications,
      sku,
      compareAtPrice,
      shortDescription,
      lowStockThreshold,
      isActive,
      isFeatured
    } = req.body;

    // Detailed validation errors array
    const errors = [];

    // Name validation with case-insensitive check
    if (!name) {
      errors.push('Product name is required');
    } else if (name.length < 3) {
      errors.push('Name must be at least 3 characters');
    } else if (name.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    } else {
      // Case-insensitive check for duplicate name
      const existingProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });
      
      if (existingProduct) {
        errors.push('A product with this name already exists');
      }
    }

    // Price validation
    if (!price) {
      errors.push('Price is required');
    } else if (isNaN(price) || price < 0) {
      errors.push('Price must be a valid non-negative number');
    }

    // Compare at price validation
    if (compareAtPrice !== undefined) {
      if (isNaN(compareAtPrice) || compareAtPrice < 0) {
        errors.push('Compare at price must be a valid non-negative number');
      } else if (Number(compareAtPrice) <= Number(price)) {
        errors.push('Compare at price must be greater than regular price');
      }
    }

    // Description validation
    if (!description) {
      errors.push('Description is required');
    } else if (description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }

    // Category validation
    if (!category) {
      errors.push('Category is required');
    } else if (!mongoose.Types.ObjectId.isValid(category)) {
      errors.push('Invalid category ID format');
    } else {
      // Verify category exists
      const categoryExists = await mongoose.model('Category').findById(category);
      if (!categoryExists) {
        errors.push('Category does not exist');
      }
    }

    // Subcategories validation
    let validatedSubcategories = [];
    if (subcategories) {
      const subcategoriesArray = Array.isArray(subcategories) 
        ? subcategories 
        : [subcategories].filter(Boolean);

      if (subcategoriesArray.length > 0) {
        if (!subcategoriesArray.every(id => mongoose.Types.ObjectId.isValid(id))) {
          errors.push('Invalid subcategory ID format');
        } else {
          const validSubcategories = await mongoose.model('Subcategory').find({
            _id: { $in: subcategoriesArray },
            category: category
          });

          if (validSubcategories.length !== subcategoriesArray.length) {
            errors.push('Some subcategories do not exist or do not belong to the selected category');
          } else {
            validatedSubcategories = subcategoriesArray;
          }
        }
      }
    }

    // Short description validation
    if (shortDescription && shortDescription.length > 200) {
      errors.push('Short description cannot exceed 200 characters');
    }

    // Stock validation
    const stockQuantity = parseInt(stock || 0);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      errors.push('Stock quantity must be a non-negative number');
    }

    // Low stock threshold validation
    if (lowStockThreshold !== undefined && (isNaN(lowStockThreshold) || lowStockThreshold < 0)) {
      errors.push('Low stock threshold must be a non-negative number');
    }

    // Image validation
    if (!req.files || req.files.length === 0) {
      errors.push('At least one product image is required');
    }

    // Specifications validation
    if (specifications) {
      if (!Array.isArray(specifications)) {
        errors.push('Specifications must be an array');
      } else {
        specifications.forEach((spec, index) => {
          if (!spec.name || !spec.value) {
            errors.push(`Specification at index ${index} must have both name and value`);
          }
        });
      }
    }

    // SKU validation (if provided) - case insensitive
    if (sku) {
      const existingSku = await Product.findOne({
        sku: { $regex: new RegExp(`^${sku}$`, 'i') }
      });
      if (existingSku) {
        errors.push('A product with this SKU already exists');
      }
    }

    // Return all validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      try {
        const cleanName = createCleanName(name);
        
        const uploadPromises = req.files.map((file, index) => {
          const uniqueSuffix = Date.now().toString().slice(-4) + '-' + index;
          const publicId = `${CLOUDINARY_FOLDERS.PRODUCTS}/${cleanName}-${uniqueSuffix}`;

          return uploadImage(file.buffer, {
            folder: CLOUDINARY_FOLDERS.PRODUCTS,
            public_id: publicId
          });
        });

        const uploadResults = await Promise.all(uploadPromises);
        uploadedImages = uploadResults.map((result, index) => ({
          url: result.secure_url,
          publicId: result.public_id,
          isDefault: index === 0,
          sortOrder: index
        }));
      } catch (uploadError) {
        await Promise.all(
          uploadedImages.map(image => 
            deleteImage(image.publicId).catch(console.error)
          )
        );
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }

    // Create product with validated data
    const product = await Product.create({
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      inStock: inStock || false,
      stockQuantity,
      category,
      subcategories: validatedSubcategories,
      images: uploadedImages,
      tags: tags || [],
      specifications: specifications || [],
      sku: sku?.trim(),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      shortDescription: shortDescription?.trim(),
      lowStockThreshold,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      metadata: {
        views: 0,
        sales: 0,
        subcategoryCount: validatedSubcategories.length
      }
    });

    // Populate category and subcategories for response
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('subcategories', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });

  } catch (error) {
    // Clean up uploaded images if product creation fails
    if (uploadedImages?.length > 0) {
      await Promise.all(
        uploadedImages.map(image =>
          deleteImage(image.publicId).catch(console.error)
        )
      );
    }

    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while creating the product'
    });
  }
};
/**
 * @desc    Get all products with filtering and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12,
      sort = "createdAt",
      order = "desc",
      search = "",
      category = "",
      subcategories = "", // Changed from subcategory
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      rating = 0,
      inStock,
      tags
    } = req.query;

    // Build query
    const query = {};
    
    // Search
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Category and subcategories
    if (category) query.category = category;
    if (subcategories) {
      const subcategoryArray = subcategories.split(',');
      query.subcategories = { $in: subcategoryArray }; // Changed to match array field
    }

    // Price range
    query.price = { 
      $gte: Number(minPrice), 
      $lte: Number(maxPrice)
    };

    // Rating
    if (rating > 0) {
      query.rating = { $gte: Number(rating) };
    }

    // Stock status
    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }

    // Tags
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Get total count for pagination
    const totalCount = await Product.countDocuments(query);

    // Get products
    const products = await Product.find(query)
      .populate("category", "name")
      .populate("subcategories", "name") // Changed from subcategory
      .sort({ [sort]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalProducts: totalCount,
        hasMore: page * limit < totalCount
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("subcategories", "name"); // Changed from subcategory
      
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */


export const updateProduct = async (req, res) => {
  let newlyUploadedImages = [];
  let existingImages = [];

  try {
    const {
      name,
      price,
      description,
      inStock,
      stock,
      category,
      subcategories,
      removedImages,
      tags,
      specifications,
      sku,
      compareAtPrice,
      shortDescription,
      lowStockThreshold,
      isActive,
      isFeatured
    } = req.body;

    // Initial price and compareAtPrice validation
    if (compareAtPrice !== undefined && price !== undefined) {
      const numericCompareAtPrice = Number(compareAtPrice);
      const numericPrice = Number(price);
      
      if (isNaN(numericCompareAtPrice) || isNaN(numericPrice)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Price and compare at price must be valid numbers']
        });
      }
      
      if (numericCompareAtPrice <= numericPrice) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Compare at price must be greater than regular price']
        });
      }
    }

    // Check if product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Store existing images for potential cleanup
    existingImages = [...product.images];

    // Detailed validation errors array
    const errors = [];

    // Name validation (if provided)
    if (name !== undefined) {
      if (name.length < 3) {
        errors.push('Name must be at least 3 characters');
      } else if (name.length > 100) {
        errors.push('Name cannot exceed 100 characters');
      } else {
        const existingProduct = await Product.findOne({ 
          name,
          _id: { $ne: req.params.id }
        });
        if (existingProduct) {
          errors.push('Product name must be unique');
        }
      }
    }

    // Price validation (if provided)
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        errors.push('Price must be a valid non-negative number');
      }
    }

    // Description validation (if provided)
    if (description !== undefined) {
      if (description.length > 2000) {
        errors.push('Description cannot exceed 2000 characters');
      }
    }

    // Category validation (if provided)
    if (category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        errors.push('Invalid category ID format');
      } else {
        const categoryExists = await mongoose.model('Category').findById(category);
        if (!categoryExists) {
          errors.push('Category does not exist');
        }
      }
    }

    // Subcategories validation (if provided)
    let validatedSubcategories = undefined;
    if (subcategories !== undefined) {
      const subcategoriesArray = Array.isArray(subcategories)
        ? subcategories
        : [subcategories].filter(Boolean);

      if (subcategoriesArray.length > 0) {
        const invalidIds = subcategoriesArray.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
          errors.push('Invalid subcategory ID format');
        } else {
          const validSubcategories = await mongoose.model('Subcategory').find({
            _id: { $in: subcategoriesArray },
            category: category || product.category
          });

          if (validSubcategories.length !== subcategoriesArray.length) {
            errors.push('Some subcategories do not exist or do not belong to the selected category');
          } else {
            validatedSubcategories = subcategoriesArray;
          }
        }
      } else {
        validatedSubcategories = [];
      }
    }

    // Optional field validations
    if (shortDescription !== undefined && shortDescription.length > 200) {
      errors.push('Short description cannot exceed 200 characters');
    }

    const stockQuantity = stock !== undefined ? parseInt(stock) : undefined;
    if (stockQuantity !== undefined && (isNaN(stockQuantity) || stockQuantity < 0)) {
      errors.push('Stock quantity must be a non-negative number');
    }

    if (lowStockThreshold !== undefined && (isNaN(lowStockThreshold) || lowStockThreshold < 0)) {
      errors.push('Low stock threshold must be a non-negative number');
    }

    // SKU validation if provided
    if (sku !== undefined) {
      const existingSku = await Product.findOne({
        sku,
        _id: { $ne: req.params.id }
      });
      if (existingSku) {
        errors.push('SKU must be unique');
      }
    }

    // Return all validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    try {
      let currentImages = [];

      // Handle image updates
      if (req.files && req.files.length > 0) {
        // Delete existing images
        await Promise.all(
          existingImages.map(async (image) => {
            if (image.publicId !== 'default') {
              const exists = await checkImageExists(image.publicId);
              if (exists) {
                await deleteImage(image.publicId);
              }
            }
          })
        );

        // Upload new images
        const cleanName = createCleanName(name || product.name);
        
        const uploadPromises = req.files.map((file, index) => {
          const uniqueSuffix = Date.now().toString().slice(-4) + '-' + index;
          const publicId = `${CLOUDINARY_FOLDERS.PRODUCTS}/${cleanName}-${uniqueSuffix}`;

          return uploadImage(file.buffer, {
            folder: CLOUDINARY_FOLDERS.PRODUCTS,
            public_id: publicId
          });
        });

        const uploadResults = await Promise.all(uploadPromises);
        newlyUploadedImages = uploadResults.map((result, index) => ({
          url: result.secure_url,
          publicId: result.public_id,
          isDefault: index === 0,
          sortOrder: index
        }));

        currentImages = [...newlyUploadedImages];
      } else if (name && existingImages.length > 0) {
        // Rename existing images if name changed
        const cleanName = createCleanName(name);
        const renamePromises = existingImages.map(async (image, index) => {
          if (image.publicId === 'default') return image;

          const uniqueSuffix = Date.now().toString().slice(-4) + '-' + index;
          const newPublicId = `${CLOUDINARY_FOLDERS.PRODUCTS}/${cleanName}-${uniqueSuffix}`;

          try {
            const result = await cloudinary.uploader.rename(
              image.publicId,
              newPublicId.replace(`${CLOUDINARY_FOLDERS.PRODUCTS}/`, '')
            );

            return {
              url: result.secure_url,
              publicId: result.public_id,
              isDefault: index === 0,
              sortOrder: index
            };
          } catch (error) {
            console.error('Error renaming image:', error);
            return image;
          }
        });

        currentImages = await Promise.all(renamePromises);
      } else {
        currentImages = existingImages;
      }

      // Prepare update object
      const updateFields = {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: Number(price) }),
        ...(description !== undefined && { description }),
        ...(inStock !== undefined && { inStock }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(category !== undefined && { category }),
        ...(validatedSubcategories !== undefined && { subcategories: validatedSubcategories }),
        ...(currentImages.length > 0 && { images: currentImages }),
        ...(tags !== undefined && { tags }),
        ...(specifications !== undefined && { specifications }),
        ...(sku !== undefined && { sku }),
        ...(compareAtPrice !== undefined && { compareAtPrice: Number(compareAtPrice) }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
        ...(isActive !== undefined && { isActive }),
        ...(isFeatured !== undefined && { isFeatured })
      };

      // Update metadata if necessary
      if (validatedSubcategories !== undefined) {
        updateFields['metadata.subcategoryCount'] = validatedSubcategories.length;
      }

      // Update product
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { 
          new: true,
          runValidators: true
        }
      )
      .populate('category', 'name')
      .populate('subcategories', 'name');

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });

    } catch (error) {
      // Rollback uploaded images if an error occurs
      if (newlyUploadedImages.length > 0) {
        await Promise.all(
          newlyUploadedImages.map(image => 
            deleteImage(image.publicId).catch(console.error)
          )
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while updating the product'
    });
  }
};
/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Delete all product images from Cloudinary
    if (product.images?.length > 0) {
      await Promise.all(
        product.images.map(async (image) => {
          const exists = await checkImageExists(image.publicId);
          if (exists) {
            await deleteImage(image.publicId);
          }
        })
      );
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};