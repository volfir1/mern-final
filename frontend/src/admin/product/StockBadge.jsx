// src/components/products/StockBadge.jsx
import React from 'react';
import { Chip } from '@mui/material';

const StockBadge = ({ product }) => {
  let color = 'default';
  let label = 'No Stock';

  if (product.inStock) {
    if (product.isLowStock) {
      color = 'warning';
      label = 'Low ';
    } else {
      color = 'success';
      label = 'In Stock';
    }
  }

  return (
    <Chip
      label={`${label} (${product.stockQuantity})`}
      color={color}
      size="small"
      className="w-24"
    />
  );
};

export default StockBadge;