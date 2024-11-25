// controllers/category.controller.js
import Category from "../models/category.js";
import Product from "../models/product.js";
import mongoose from "mongoose";
import { uploadImage, deleteImage, checkImageExists, CLOUDINARY_FOLDERS, DEFAULT_IMAGES,
  IMAGE_TRANSFORMATIONS  } from '../utils/cloudinary.js';


/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCleanName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const createCategory = async (req, res) => {
  // Define imageData in outer scope
  let imageData = {
    url: DEFAULT_IMAGES.CATEGORY,
    publicId: 'default'
  };

  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: name.trim() 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    // Handle image upload
    if (req.file) {
      try {
        const cleanName = createCleanName(name);
        const uniqueSuffix = Date.now().toString().slice(-4);
        const publicId = `${CLOUDINARY_FOLDERS.CATEGORIES}/${cleanName}-${uniqueSuffix}`;

        const uploadResult = await uploadImage(req.file.buffer, {
          folder: CLOUDINARY_FOLDERS.CATEGORIES,
          public_id: publicId,
          transformation: [
            IMAGE_TRANSFORMATIONS.profile, // Using predefined transformation
            { quality: 'auto' }
          ]
        });
        
        imageData = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        };
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }

    // Create category
    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      image: imageData
    });

    // Return response with populated subcategories
    const populatedCategory = await Category.findById(category._id)
      .populate({
        path: 'subcategories',
        select: 'name slug image isActive'
      });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category: populatedCategory,
        imageDetails: imageData.publicId !== 'default' ? {
          url: imageData.url,
          publicId: imageData.publicId,
          folder: CLOUDINARY_FOLDERS.CATEGORIES
        } : null
      }
    });

  } catch (error) {
    console.error('Create category error:', error);

    // Clean up uploaded image if category creation fails
    if (imageData?.publicId && imageData.publicId !== 'default') {
      await deleteImage(imageData.publicId).catch(console.error);
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists',
        error: 'Duplicate name'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format"
      });
    }

    const { name, description } = req.body;
    
    console.log('Update request:', {
      id: req.params.id,
      body: req.body,
      file: req.file ? 'Present' : 'Not present'
    });

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Check if name is being updated
    const isNameUpdated = name && name.trim() !== category.name;
    const cleanNewName = isNameUpdated ? createCleanName(name.trim()) : createCleanName(category.name);
    const uniqueSuffix = Date.now().toString().slice(-4);

    // Prepare update data
    let updateData = {
      name: name?.trim() || category.name,
      description: description?.trim() || category.description,
      image: category.image
    };

    // Handle image update or rename
    if (req.file || isNameUpdated) {
      try {
        // Construct proper new public ID without duplicate folders
        const newPublicId = `${CLOUDINARY_FOLDERS.CATEGORIES}/${cleanNewName}-${uniqueSuffix}`;

        if (req.file) {
          // Upload new image with new name
          const uploadResult = await uploadImage(req.file.buffer, {
            public_id: newPublicId,
            transformation: [
              IMAGE_TRANSFORMATIONS.profile,
              { quality: 'auto' }
            ]
          });

          updateData.image = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
          };

          // Delete old image if it exists and isn't default
          if (category.image?.publicId && category.image.publicId !== 'default') {
            const imageExists = await checkImageExists(category.image.publicId);
            if (imageExists) {
              await deleteImage(category.image.publicId);
            }
          }
        } else if (isNameUpdated && category.image?.publicId && category.image.publicId !== 'default') {
          // Rename existing image
          try {
            const renameResult = await cloudinary.uploader.rename(
              category.image.publicId,
              newPublicId
            );

            updateData.image = {
              url: renameResult.secure_url,
              publicId: renameResult.public_id
            };
          } catch (renameError) {
            console.error('Image rename error:', renameError);
            // Keep the old image if rename fails
            console.log('Keeping original image due to rename failure');
          }
        }
      } catch (imageError) {
        console.error('Image operation error:', imageError);
        return res.status(400).json({
          success: false,
          message: 'Error processing image',
          error: imageError.message
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'subcategories',
      select: 'name slug image isActive'
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: updatedCategory,
        imageDetails: updateData.image?.publicId !== 'default' ? {
          url: updateData.image.url,
          publicId: updateData.image.publicId,
          folder: CLOUDINARY_FOLDERS.CATEGORIES,
          renamed: isNameUpdated && !req.file,
          nameUpdated: isNameUpdated
        } : null
      }
    });

  } catch (error) {
    console.error('Update category error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists',
        error: 'Duplicate name'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = "name", 
      order = "desc", 
      search = "",
      includeSubcategories = false
    } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Get total count for pagination
    const totalCount = await Category.countDocuments(query);

    // Get categories with optional population
    let categoriesQuery = Category.find(query)
      .sort({ [sort]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (includeSubcategories === 'true') {
      categoriesQuery = categoriesQuery.populate('subcategories');
    }

    let categories = await categoriesQuery;

    // Calculate stock for each category
    categories = await Promise.all(categories.map(async (category) => {
      // Convert to plain object to add custom fields
      const categoryObj = category.toObject();
      
      // Get direct products stock in this category
      const directProductsStock = await Product.aggregate([
        { $match: { 'category._id': category._id } },
        { $group: { 
          _id: null, 
          totalStock: { $sum: "$stockQuantity" } 
        }}
      ]);
      
      categoryObj.directStock = directProductsStock[0]?.totalStock || 0;
      
      // If subcategories are included, calculate their stock too
      if (includeSubcategories === 'true' && category.subcategories?.length > 0) {
        const subcategoryIds = category.subcategories.map(sub => sub._id);
        
        const subcategoriesStock = await Product.aggregate([
          { $match: { 'subcategories': { $elemMatch: { _id: { $in: subcategoryIds } } } } },
          { $group: { 
            _id: null, 
            totalStock: { $sum: "$stockQuantity" } 
          }}
        ]);
        
        categoryObj.subcategoriesStock = subcategoriesStock[0]?.totalStock || 0;
        
        // Add stock information to each subcategory
        categoryObj.subcategories = await Promise.all(category.subcategories.map(async (subcategory) => {
          const subObj = subcategory.toObject();
          const subStock = await Product.aggregate([
            { $match: { 'subcategories': { $elemMatch: { _id: subcategory._id } } } },
            { $group: { 
              _id: null, 
              totalStock: { $sum: "$stockQuantity" } 
            }}
          ]);
          subObj.stock = subStock[0]?.totalStock || 0;
          return subObj;
        }));
      }
      
      // Calculate total stock (direct + subcategories)
      categoryObj.totalStock = categoryObj.directStock + (categoryObj.subcategoriesStock || 0);
      
      return categoryObj;
    }));

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCategories: totalCount,
        hasMore: page * limit < totalCount
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Check for existing subcategories
    const subcategoriesCount = await Category.countDocuments({ category: category._id });
    if (subcategoriesCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with existing subcategories"
      });
    }

    // Delete image from Cloudinary if exists
    if (category.image?.publicId) {
      const imageExists = await checkImageExists(category.image.publicId);
      if (imageExists) {
        await deleteImage(category.image.publicId);
      }
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};