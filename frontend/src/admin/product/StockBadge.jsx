// components/products/StockBadge.jsx
import React from 'react';
import { Chip } from '@mui/material';

const StockBadge = ({ product }) => {
  const getStockStatus = () => {
    const quantity = Number(product.stockQuantity) || 0;
    const threshold = Number(product.lowStockThreshold) || 5;

    if (quantity <= 0) {
      return {
        label: `Out of Stock`,
        color: 'error'
      };
    }

    if (quantity <= threshold) {
      return {
        label: `Low Stock (${quantity})`,
        color: 'warning'
      };
    }

    return {
      label: `In Stock (${quantity})`,
      color: 'success'
    };
  };

  const status = getStockStatus();

  return (
    <Chip
      label={status.label}
      color={status.color}
      size="small"
      variant={status.color === 'error' ? 'filled' : 'outlined'}
      className="min-w-[100px]"
    />
  );
};

export default StockBadge;