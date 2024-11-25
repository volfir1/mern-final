// src/admin/category/CategoryImage.jsx
import React, { memo } from 'react';
import { Image as ImageIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const CategoryImage = memo(({ imageUrl }) => (
  <div className="h-48 bg-gray-100 relative overflow-hidden">
    {imageUrl ? (
      <img
        src={imageUrl}
        alt="Category"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon className="text-gray-400 w-16 h-16" />
      </div>
    )}
  </div>
));

CategoryImage.propTypes = {
  imageUrl: PropTypes.string
};

CategoryImage.displayName = 'CategoryImage';

export default CategoryImage;