import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  IconButton, 
  CircularProgress, 
  Tooltip 
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SupplierImage = ({
  imagePreview,
  onImageChange,
  onImageDelete,
  validation,
  size = 'medium',
  disabled = false,
  loading = false,
  showTooltips = true
}) => {
  // Calculate dimensions based on size prop
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return 'h-32 w-32';
      case 'large':
        return 'h-48 w-48';
      default: // medium
        return 'h-40 w-40';
    }
  };

  const dimensions = getDimensions();

  // Validate file before upload
  const validateFile = useCallback((file) => {
    if (!file) return 'No file selected';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG and WebP images are allowed';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 5MB limit';
    }
    return null;
  }, []);

  // Handle file input change
  const handleChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      // If validation is provided as a callback
      if (typeof validation === 'function') {
        validation(error);
      }
      return;
    }

    onImageChange(event);
  }, [onImageChange, validateFile, validation]);

  // Render preview image with error state
  const renderPreview = () => (
    <div className="relative group">
      <img
        src={imagePreview}
        alt="Supplier"
        className={`
          ${dimensions} 
          object-cover 
          rounded-lg 
          border-2 
          ${validation ? 'border-red-500' : 'border-gray-200'}
        `}
      />
      {/* Overlay with actions */}
      {!disabled && (
        <div className="
          absolute inset-0 
          bg-black bg-opacity-50 
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-200 
          rounded-lg 
          flex items-center justify-center
        ">
          <Tooltip title="Delete image" arrow placement="top">
            <IconButton
              onClick={onImageDelete}
              className="text-white hover:text-red-500"
              size="small"
              disabled={loading}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </div>
      )}
      {/* Error indicator */}
      {validation && (
        <Tooltip title={validation} arrow placement="top">
          <ErrorIcon 
            className="absolute top-2 right-2 text-red-500" 
            fontSize="small"
          />
        </Tooltip>
      )}
    </div>
  );

  // Render upload button
  const renderUploadButton = () => (
    <Tooltip 
      title={disabled ? 'Image upload disabled' : 'Upload image'} 
      arrow 
      placement="top"
      open={showTooltips ? undefined : false}
    >
      <label className={`
        ${dimensions}
        flex flex-col items-center justify-center
        border-2 border-dashed 
        ${validation ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}
        rounded-lg cursor-pointer
        hover:bg-gray-50 transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${loading ? 'animate-pulse' : ''}
      `}>
        <input
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={ALLOWED_TYPES.join(',')}
          disabled={disabled || loading}
        />
        {loading ? (
          <CircularProgress size={36} className="text-blue-500 mb-2" />
        ) : (
          <CloudUploadIcon 
            className="text-gray-400 mb-2" 
            style={{ fontSize: 36 }} 
          />
        )}
        <span className="text-sm text-gray-500">
          {loading ? 'Uploading...' : 'Upload Image'}
        </span>
        {size === 'medium' && !loading && (
          <span className="text-xs text-gray-400 mt-1">
            Max 5MB (JPEG, PNG, WebP)
          </span>
        )}
      </label>
    </Tooltip>
  );

  return (
    <Box className="flex flex-col items-center mb-6">
      <div className={`relative ${dimensions}`}>
        {imagePreview ? renderPreview() : renderUploadButton()}
      </div>
      {validation && typeof validation === 'string' && (
        <span className="text-red-500 text-sm mt-1">{validation}</span>
      )}
    </Box>
  );
};

SupplierImage.propTypes = {
  imagePreview: PropTypes.string,
  onImageChange: PropTypes.func.isRequired,
  onImageDelete: PropTypes.func.isRequired,
  validation: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  showTooltips: PropTypes.bool
};

export default React.memo(SupplierImage);