// utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Constants for Cloudinary folders
export const CLOUDINARY_FOLDERS = {
  USERS: 'ecommerce/users',
  PRODUCTS: 'ecommerce/products',
  CATEGORIES: 'ecommerce/categories',
  SUBCATEGORIES: 'ecommerce/subcategories',
  SUPPLIERS: 'ecommerce/suppliers'  // Added supplier folder

};

// Default images
export const DEFAULT_IMAGES = {
  USER: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/ecommerce/defaults/user-default.png`,
  PRODUCT: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/ecommerce/defaults/product-default.png`,
  CATEGORY: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/ecommerce/defaults/category-default.png`,
  SUPPLIER: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/ecommerce/defaults/supplier-default.png`  // Added supplier default
};

/**
 * Upload an image to Cloudinary
 * @param {Buffer} imageBuffer - The image buffer to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadImage = (imageBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'ecommerce',
      resource_type: 'auto',
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload failed:', error);
          reject(new Error('Image upload failed'));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(imageBuffer);
  });
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary deletion failed:', error);
    throw new Error('Image deletion failed');
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<Buffer>} imageBuffers - Array of image buffers
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Array of Cloudinary upload results
 */
export const uploadMultipleImages = async (imageBuffers, options = {}) => {
  try {
    const uploadPromises = imageBuffers.map(buffer => 
      uploadImage(buffer, options)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple image upload failed:', error);
    throw new Error('Failed to upload multiple images');
  }
};

/**
 * Get the Cloudinary URL for an image with transformations
 * @param {string} publicId - The public ID of the image
 * @param {Object} transformations - Cloudinary transformation options
 * @returns {string} Transformed image URL
 */
export const getImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations
  });
};

/**
 * Check if an image exists in Cloudinary
 * @param {string} publicId - The public ID to check
 * @returns {Promise<boolean>} Whether the image exists
 */
export const checkImageExists = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return !!result;
  } catch (error) {
    return false;
  }
};




// Example transformations for different use cases
export const IMAGE_TRANSFORMATIONS = {
  thumbnail: {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto'
  },
  profile: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto'
  },
  product: {
    width: 800,
    height: 800,
    crop: 'fill',
    quality: 'auto'
  },
  supplier: {  // Added supplier-specific transformations
    logo: {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto'
    },
    banner: {
      width: 1200,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      gravity: 'center'
    }
  }
};

export default {
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  getImageUrl,
  checkImageExists,
  CLOUDINARY_FOLDERS,
  DEFAULT_IMAGES,
  IMAGE_TRANSFORMATIONS
};