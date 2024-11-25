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
      stockQuantity: stock,  // Rename in destructuring
      inStock,
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
    if (!name || !name.trim()) {
      errors.push('Product name is required');
    } else if (name.length < 3) {
      errors.push('Name must be at least 3 characters');
    } else if (name.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    } else {
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

    // Compare at price validation - only if it's provided
    if (compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== '') {
      const compareAtPriceNum = Number(compareAtPrice);
      if (isNaN(compareAtPriceNum) || compareAtPriceNum < 0) {
        errors.push('Compare at price must be a valid non-negative number');
      } else if (compareAtPriceNum <= Number(price)) {
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
      const categoryExists = await mongoose.model('Category').findById(category);
      if (!categoryExists) {
        errors.push('Category does not exist');
      }
    }

    // Stock validation
    const stockQuantity = parseInt(stock || 0);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      errors.push('Stock quantity must be a non-negative number');
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

    // Create product
    const product = await Product.create({
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      stockQuantity,
      inStock: inStock || false,
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

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('subcategories', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });

  } catch (error) {
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


export const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12,
      sort = "createdAt",
      order = "desc",
      search = "",
      category = "",
      subcategories = "",
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      inStock,
      minStock,
      maxStock,
      lowStock,
      tags
    } = req.query;

    const query = {};
    
    // Stock filters
    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }

    if (minStock !== undefined || maxStock !== undefined) {
      query.stockQuantity = {};
      if (minStock !== undefined) {
        query.stockQuantity.$gte = Number(minStock);
      }
      if (maxStock !== undefined) {
        query.stockQuantity.$lte = Number(maxStock);
      }
    }

    // Low stock filter
    if (lowStock === 'true') {
      query.$expr = {
        $and: [
          { $gt: ['$stockQuantity', 0] },
          { $lte: ['$stockQuantity', '$lowStockThreshold'] }
        ]
      };
    }

    // Other filters...
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (category) query.category = category;
    if (subcategories) {
      const subcategoryArray = subcategories.split(',');
      query.subcategories = { $in: subcategoryArray };
    }
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Price range
    query.price = { 
      $gte: Number(minPrice), 
      $lte: Number(maxPrice)
    };

    const totalCount = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("subcategories", "name")
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

// export const updateProductStock = async (req, res) => {
//   try {
//     const { stock, lowStockThreshold } = req.body;

//     const stockQuantity = parseInt(stock);
//     const threshold = parseInt(lowStockThreshold);

//     // Validation
//     if (isNaN(stockQuantity) || stockQuantity < 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Stock quantity must be a non-negative number'
//       });
//     }

//     if (threshold !== undefined && (isNaN(threshold) || threshold < 0)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Low stock threshold must be a non-negative number'
//       });
//     }

//     const updateFields = {
//       stockQuantity,
//       inStock: stockQuantity > 0
//     };

//     if (threshold !== undefined) {
//       updateFields.lowStockThreshold = threshold;
//     }

//     const product = await Product.findByIdAndUpdate(
//       req.params.id,
//       updateFields,
//       { new: true, runValidators: true }
//     );

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Stock updated successfully',
//       data: product
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: 'Failed to update stock',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
//     });
//   }
// };

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
      stockQuantity: stock,  // Rename in destructuring
      inStock,
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

    // Check if product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Store existing images
    existingImages = [...product.images];

    // Detailed validation errors array
    const errors = [];

    // Stock validation
    let stockQuantity;
    if (stock !== undefined) {
      stockQuantity = parseInt(stock);
      if (isNaN(stockQuantity) || stockQuantity < 0) {
        errors.push('Stock quantity must be a non-negative number');
      }
    }

    // Name validation (if provided)
    if (name !== undefined) {
      if (!name.trim()) {
        errors.push('Product name cannot be empty');
      } else if (name.length < 3) {
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

    // Price and compareAtPrice validation - only if either is being updated
    if (price !== undefined || compareAtPrice !== undefined) {
      const newPrice = price !== undefined ? Number(price) : product.price;
      
      if (price !== undefined && (isNaN(newPrice) || newPrice < 0)) {
        errors.push('Price must be a valid non-negative number');
      }

      if (compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== '') {
        const compareAtPriceNum = Number(compareAtPrice);
        if (isNaN(compareAtPriceNum) || compareAtPriceNum < 0) {
          errors.push('Compare at price must be a valid non-negative number');
        } else if (compareAtPriceNum <= newPrice) {
          errors.push('Compare at price must be greater than regular price');
        }
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

    // Handle image updates if present
    if (req.files && req.files.length > 0) {
      try {
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
      } catch (error) {
        if (newlyUploadedImages.length > 0) {
          await Promise.all(
            newlyUploadedImages.map(image => 
              deleteImage(image.publicId).catch(console.error)
            )
          );
        }
        throw error;
      }
    }

    // Prepare update object
    const updateFields = {
      ...(name && { name: name.trim() }),
      ...(price && { price: Number(price) }),
      ...(description && { description: description.trim() }),
      ...(stockQuantity !== undefined && { stockQuantity }),
      ...(inStock !== undefined && { inStock }),
      ...(category && { category }),
      ...(subcategories && { subcategories }),
      ...(newlyUploadedImages.length > 0 && { images: newlyUploadedImages }),
      ...(tags && { tags }),
      ...(specifications && { specifications }),
      ...(sku && { sku: sku.trim() }),
      ...(compareAtPrice !== undefined && { compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined }),
      ...(shortDescription && { shortDescription: shortDescription.trim() }),
      ...(lowStockThreshold !== undefined && { lowStockThreshold }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured })
    };

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
    if (newlyUploadedImages.length > 0) {
      await Promise.all(
        newlyUploadedImages.map(image => 
          deleteImage(image.publicId).catch(console.error)
        )
      );
    }

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