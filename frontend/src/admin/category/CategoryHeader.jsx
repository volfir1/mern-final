import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

const CategoryHeader = React.memo(({ 
  onAddNew, 
  onAddSubcategory, 
  onRefresh, 
  isLoading = false,
  selectedCategoryId = null,
}) => {
  return (
    <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-3">
        <Typography 
          variant="h4" 
          component="h1" 
          className="font-bold text-gray-900"
        >
          Category Management
        </Typography>
        <Tooltip title="Refresh Categories" arrow>
          <span>
            <IconButton
              onClick={onRefresh}
              className={`transition-all duration-300 ${
                isLoading 
                  ? 'bg-red-50 text-red-500' 
                  : 'hover:bg-red-50 text-gray-500 hover:text-red-500'
              }`}
              disabled={isLoading}
              size="small"
            >
              {isLoading ? (
                <CircularProgress 
                  size={24} 
                  className="text-red-500"
                  thickness={4}
                />
              ) : (
                <RefreshIcon className="w-5 h-5" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onAddNew}
          disabled={isLoading}
          className={`
            min-w-[160px] h-10 px-4
            bg-red-500 hover:bg-red-600 disabled:bg-red-300
            text-white shadow-md hover:shadow-lg
            transition-all duration-300
            rounded-full normal-case font-medium
            flex items-center gap-2
          `}
          startIcon={<AddIcon />}
        >
          Add Category
        </Button>

        <Button
          onClick={() => onAddSubcategory(selectedCategoryId)}
          disabled={isLoading}
          className={`
            min-w-[160px] h-10 px-4
            bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300
            text-white shadow-md hover:shadow-lg
            transition-all duration-300
            rounded-full normal-case font-medium
            flex items-center gap-2
          `}
          startIcon={<CategoryIcon />}
        >
          Add Subcategory
        </Button>
      </div>
    </div>
  );
});

CategoryHeader.propTypes = {
  onAddNew: PropTypes.func.isRequired,
  onAddSubcategory: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  selectedCategoryId: PropTypes.string
};

CategoryHeader.displayName = 'CategoryHeader';

export default CategoryHeader;