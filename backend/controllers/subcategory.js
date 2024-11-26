// controllers/subcategory.controller.js
import Subcategory from '../models/subcategory.js';
import Category from '../models/category.js';
import { uploadImage, deleteImage, checkImageExists } from '../utils/cloudinary.js';
import { CLOUDINARY_FOLDERS } from '../utils/cloudinary.js';

/**
 * @desc    Create a new subcategory
 * @route   POST /api/subcategories
 * @access  Private/Admin
 */
export const createSubcategory = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    const { name, categoryId } = req.body;

    // Validate required fields
    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and category ID'
      });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if subcategory name already exists in the category
    const existingSubcategory = await Subcategory.findOne({
      name: name.trim(),
      category: categoryId
    });

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory name already exists in this category'
      });
    }

    // Prepare subcategory data
    let subcategoryData = {
      name: name.trim(),
      category: categoryId,
      description: req.body.description,
      isActive: true,
      orderIndex: 0
    };

    // Handle image upload if provided
    if (req.file) {
      try {
        const cloudinaryResult = await uploadImage(req.file.buffer, {
          folder: CLOUDINARY_FOLDERS.SUBCATEGORIES,
          public_id: `subcategory-${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fill' },
            { quality: 'auto' }
          ]
        });

        subcategoryData.image = {
          url: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id
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

    // Create subcategory
    const subcategory = await Subcategory.create(subcategoryData);

    // Update category metadata
    await category.updateMetadata();

    // Return response with populated category
    const populatedSubcategory = await Subcategory.findById(subcategory._id)
      .populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: {
        subcategory: {
          _id: populatedSubcategory._id,
          name: populatedSubcategory.name,
          description: populatedSubcategory.description,
          slug: populatedSubcategory.slug,
          category: populatedSubcategory.category,
          image: populatedSubcategory.image,
          isActive: populatedSubcategory.isActive,
          orderIndex: populatedSubcategory.orderIndex,
          createdAt: populatedSubcategory.createdAt
        },
        categoryDetails: {
          _id: category._id,
          name: category.name,
          slug: category.slug
        },
        imageDetails: subcategoryData.image ? {
          url: subcategoryData.image.url,
          publicId: subcategoryData.image.publicId
        } : null
      }
    });

  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subcategory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


/**
 * @desc    Update subcategory
 * @route   PUT /api/subcategories/:id
 * @access  Private/Admin
 */
export const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId } = req.body;

    // Find existing subcategory
    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Prepare update data
    let updateData = {
      name: name || subcategory.name
    };

    // Update category if provided
    if (categoryId && categoryId !== subcategory.category.toString()) {
      const newCategory = await Category.findById(categoryId);
      if (!newCategory) {
        return res.status(404).json({
          success: false,
          message: 'New category not found'
        });
      }
      updateData.category = categoryId;
    }

    // Handle image update if provided
    if (req.file) {
      try {
        const cloudinaryResult = await uploadImage(req.file.buffer, {
          folder: CLOUDINARY_FOLDERS.SUBCATEGORIES,
          public_id: `subcategory-${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fill' },
            { quality: 'auto' }
          ]
        });

        updateData.image = {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.secure_url
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

    // Update subcategory
    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Subcategory updated successfully',
      data: {
        subcategory: updatedSubcategory,
        cloudinaryDetails: updateData.image ? {
          public_id: updateData.image.public_id,
          url: updateData.image.url
        } : null
      }
    });

  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subcategory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all subcategories
 * @route   GET /api/subcategories
 * @access  Public
 */
export const getSubcategories = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = "name", 
      order = "asc", 
      search = "", 
      category = "" 
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    
    if (category) {
      query.category = category;
    }

    const totalCount = await Subcategory.countDocuments(query);
    const subcategories = await Subcategory.find(query)
      .populate("category", "name")
      .sort({ [sort]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: subcategories,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalSubcategories: totalCount,
        hasMore: page * limit < totalCount
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message
    });
  }
};

/**
 * @desc    Get subcategory by ID
 * @route   GET /api/subcategories/:id
 * @access  Public
 */
export const getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id)
      .populate("category", "name");
      
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch subcategory',
      error: error.message
    });
  }
};

/**
 * @desc    Delete subcategory
 * @route   DELETE /api/subcategories/:id
 * @access  Private/Admin
 */
export const deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found"
      });
    }

    // Check for existing products
    const productsCount = await Subcategory.countDocuments({ subcategory: subcategory._id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete subcategory with existing products"
      });
    }

    // Delete image from Cloudinary if exists
    if (subcategory.image?.publicId) {
      const imageExists = await checkImageExists(subcategory.image.publicId);
      if (imageExists) {
        await deleteImage(subcategory.image.publicId);
      }
    }

    await subcategory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete subcategory',
      error: error.message
    });
  }
};

/**
 * @desc    Get subcategories by category
 * @route   GET /api/subcategories/category/:categoryId
 * @access  Public
 */
export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const subcategories = await Subcategory.find({ category: categoryId })
      .populate('category', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: subcategories,
      category: {
        _id: category._id,
        name: category.name
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message
    });
  }
};