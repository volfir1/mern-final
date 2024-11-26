// src/admin/category/SubCategoryItem.jsx
import React, { memo } from 'react';
import {
  IconButton,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const SubCategoryItem = memo(({ 
  subcategory, 
  onEdit, 
  onDelete,
  disableActions 
}) => (
  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100">
    <div className="flex items-center gap-2">
      {subcategory.image?.url ? (
        <img
          src={subcategory.image.url}
          alt={subcategory.name}
          className="w-8 h-8 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <Typography variant="body2" className="font-medium">
        {subcategory.name}
      </Typography>
    </div>
    <div className="flex gap-1">
      <IconButton 
        size="small" 
        className="text-blue-600 hover:bg-blue-50"
        onClick={() => onEdit(subcategory, 'subcategory')}
        disabled={disableActions}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton 
        size="small" 
        className="text-red-600 hover:bg-red-50"
        onClick={() => onDelete(subcategory)}
        disabled={disableActions}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </div>
  </div>
));

SubCategoryItem.propTypes = {
  subcategory: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.shape({
      url: PropTypes.string
    })
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  disableActions: PropTypes.bool
};

SubCategoryItem.displayName = 'SubCategoryItem';

export default SubCategoryItem;