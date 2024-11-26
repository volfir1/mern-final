import React, { memo } from 'react';
import { Typography, CircularProgress } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import CategoryCard from './CategoryCard';

const CategoryGrid = memo(({
  categories = [],
  isLoading = false,
  onEdit,
  onDelete,
  onAddSubcategory,
  onSubcategoryEdit,
  onSubcategoryDelete,
  disableActions = false
}) => {
  if (isLoading) {
    return (
      <div className="col-span-full flex justify-center py-20">
        <CircularProgress className="text-red-500" />
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <div className="col-span-full text-center py-20">
        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <Typography variant="h6" className="text-gray-500">
          No categories found
        </Typography>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {categories.map((category) => (
        <CategoryCard
          key={category._id}
          category={category}
          onEdit={() => onEdit(category)}
          onCategoryDelete={() => onDelete(category)}
          onAddSubcategory={() => onAddSubcategory(category._id)}
          onSubcategoryEdit={(subcategory) => onSubcategoryEdit({
            ...subcategory,
            parentCategory: {
              _id: category._id,
              name: category.name
            }
          })}
          onSubcategoryDelete={(subcategory) => onSubcategoryDelete({
            ...subcategory,
            parentCategory: {
              _id: category._id,
              name: category.name
            }
          })}
          disableActions={disableActions}
        />
      ))}
    </div>
  );
});

CategoryGrid.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    image: PropTypes.shape({
      url: PropTypes.string
    }),
    totalStock: PropTypes.number,
    subcategories: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }))
  })),
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddSubcategory: PropTypes.func.isRequired,
  onSubcategoryEdit: PropTypes.func.isRequired,
  onSubcategoryDelete: PropTypes.func.isRequired,
  disableActions: PropTypes.bool
};

CategoryGrid.displayName = 'CategoryGrid';

export default CategoryGrid;