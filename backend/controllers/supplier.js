import Supplier from "../models/supplier.js";
import Product from "../models/product.js";
import APIFeatures from "../utils/api-features.js";
import { 
  uploadImage, 
  deleteImage, 
  CLOUDINARY_FOLDERS, 
  checkImageExists,
  IMAGE_TRANSFORMATIONS 
} from '../utils/cloudinary.js';

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?\d{1,3}?[- ]?\(?\d{1,3}\)?[- ]?\d{3,4}[- ]?\d{4}$/;
  return phoneRegex.test(phone);
};

const validateZipCode = (zipCode) => {
  // Basic zip code validation - can be customized based on country
  return /^\d{5}(-\d{4})?$/.test(zipCode);
};

// Helper function for supplier image upload with enhanced error handling
const uploadSupplierImage = async (imageBuffer, type = 'logo') => {
  if (!imageBuffer) {
    throw new Error('No image buffer provided');
  }

  try {
    const transformation = IMAGE_TRANSFORMATIONS.profile;
    const result = await uploadImage(imageBuffer, {
      folder: CLOUDINARY_FOLDERS.SUPPLIERS,
      transformation,
      tags: ['supplier', type]
    });
    return result;
  } catch (error) {
    console.error('Supplier image upload failed:', error);
    throw new Error('Failed to upload supplier image: ' + error.message);
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      street,
      city,
      state,
      country,
      zipCode,
      description 
    } = req.body;
    
    // Enhanced validation
    const validationErrors = [];

    // Name validation
    if (!name || name.length < 3) {
      validationErrors.push('Name must be at least 3 characters long');
    }
    if (name && name.length > 100) {
      validationErrors.push('Name cannot exceed 100 characters');
    }

    // Email validation
    if (!email) {
      validationErrors.push('Email is required');
    } else if (!validateEmail(email)) {
      validationErrors.push('Invalid email format');
    }

    // Phone validation
    if (!phone) {
      validationErrors.push('Phone number is required');
    } else if (!validatePhone(phone)) {
      validationErrors.push('Invalid phone number format');
    }

    // Address validations
    if (!street || street.trim().length === 0) validationErrors.push('Street address is required');
    if (!city || city.trim().length === 0) validationErrors.push('City is required');
    if (!state || state.trim().length === 0) validationErrors.push('State is required');
    if (!country || country.trim().length === 0) validationErrors.push('Country is required');
    if (!zipCode) {
      validationErrors.push('Zip code is required');
    } else if (!validateZipCode(zipCode)) {
      validationErrors.push('Invalid zip code format');
    }

    // Description validation
    if (description && description.length > 2000) {
      validationErrors.push('Description cannot exceed 2000 characters');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if email already exists
    const existingSupplier = await Supplier.findOne({ email: email.toLowerCase() });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const supplier = new Supplier({
      name,
      email: email.toLowerCase(),
      phone,
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      zipCode: zipCode.trim(),
      description: description ? description.trim() : undefined
    });

    // Handle image upload
    if (req.file) {
      try {
        const result = await uploadSupplierImage(req.file.buffer, 'logo');
        supplier.image = result.secure_url;
        supplier.cloudinaryId = result.public_id; // Store Cloudinary ID for future updates/deletion
      } catch (imageError) {
        return res.status(400).json({ 
          success: false, 
          message: "Image upload failed", 
          error: imageError.message 
        });
      }
    }

    await supplier.save();
    res.status(201).json({
      success: true,
      supplier
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      street,
      city,
      state,
      country,
      zipCode,
      description,
      active 
    } = req.body;

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        message: "Supplier not found" 
      });
    }

    // Validation for update
    const validationErrors = [];

    if (name) {
      if (name.length < 3) validationErrors.push('Name must be at least 3 characters long');
      if (name.length > 100) validationErrors.push('Name cannot exceed 100 characters');
    }

    if (email) {
      if (!validateEmail(email)) {
        validationErrors.push('Invalid email format');
      }
      // Check if new email exists for other suppliers
      const existingSupplier = await Supplier.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existingSupplier) {
        validationErrors.push('Email already registered to another supplier');
      }
    }

    if (phone && !validatePhone(phone)) {
      validationErrors.push('Invalid phone number format');
    }

    if (zipCode && !validateZipCode(zipCode)) {
      validationErrors.push('Invalid zip code format');
    }

    if (description && description.length > 2000) {
      validationErrors.push('Description cannot exceed 2000 characters');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Update fields
    if (name) supplier.name = name;
    if (email) supplier.email = email.toLowerCase();
    if (phone) supplier.phone = phone;
    if (street) supplier.street = street.trim();
    if (city) supplier.city = city.trim();
    if (state) supplier.state = state.trim();
    if (country) supplier.country = country.trim();
    if (zipCode) supplier.zipCode = zipCode.trim();
    if (description !== undefined) supplier.description = description ? description.trim() : '';
    if (active !== undefined) supplier.active = active;

    // Handle image update
    if (req.file) {
      try {
        // Delete old image if exists
        if (supplier.cloudinaryId) {
          await deleteImage(supplier.cloudinaryId);
        }

        const result = await uploadSupplierImage(req.file.buffer, 'logo');
        supplier.image = result.secure_url;
        supplier.cloudinaryId = result.public_id;
      } catch (imageError) {
        return res.status(400).json({ 
          success: false,
          message: "Image update failed",
          error: imageError.message 
        });
      }
    }

    await supplier.save();
    res.json({
      success: true,
      supplier
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const resPerPage = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    if (resPerPage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum limit per page is 100'
      });
    }

    const apiFeatures = new APIFeatures(Supplier.find(), req.query)
      .search()
      .filter()
      .pagination(resPerPage)
      .validate();

    const suppliers = await apiFeatures.query;
    const totalSuppliers = await Supplier.countDocuments(apiFeatures.query.getFilter());

    res.json({
      success: true,
      count: suppliers.length,
      total: totalSuppliers,
      totalPages: Math.ceil(totalSuppliers / resPerPage),
      currentPage: page,
      suppliers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getSupplierByID = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        message: "Supplier not found" 
      });
    }
    res.json({
      success: true,
      supplier
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        message: "Supplier not found" 
      });
    }

    // Delete image from Cloudinary if exists
    if (supplier.cloudinaryId) {
      await deleteImage(supplier.cloudinaryId);
    }

    await supplier.deleteOne();
    res.json({ 
      success: true,
      message: "Supplier deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const addProductToSupplier = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        message: "Supplier not found" 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    // Check if product is already added
    if (supplier.products.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product already added to this supplier"
      });
    }

    await supplier.addProduct(productId);
    res.json({ 
      success: true,
      message: "Product added to supplier successfully" 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const removeProductFromSupplier = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        message: "Supplier not found" 
      });
    }

    // Check if product exists in supplier's products
    if (!supplier.products.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product not found in supplier's products"
      });
    }

    await supplier.removeProduct(productId);
    res.json({ 
      success: true,
      message: "Product removed from supplier successfully" 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const updateSupplierInventory = async (req, res) => {
  try {
    const { productId, stockQuantity } = req.body;

    // Validate input
    if (!productId || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID and stock quantity are required"
      });
    }

    if (stockQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity cannot be negative"
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        message: "Supplier not found" 
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    await supplier.updateInventory(productId, stockQuantity);
    res.json({ 
      success: true,
      message: "Supplier inventory updated successfully" 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};