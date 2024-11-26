// src/components/products/ProductTable.jsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import StockBadge from './StockBadge';

const ProductTable = ({
  products,
  onEdit,
  onDelete,
  onViewDetails,
  formatPrice
}) => {
  return (
    <TableContainer component={Paper} className="mb-4">
      <Table>
        <TableHead>
          <TableRow className="bg-gray-50">
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="center">Stock Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product._id} hover>
              <TableCell>
                <div className="flex items-center">
                  {product.images && product.images[0] && (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                  )}
                  <div>
                    <Typography variant="subtitle2">{product.name}</Typography>
                    <Typography variant="caption" className="text-gray-500">
                      {product.shortDescription || 'No description'}
                    </Typography>
                  </div>
                </div>
              </TableCell>
              <TableCell>{product.sku || 'N/A'}</TableCell>
              <TableCell align="right">
                <div>
                  <Typography variant="subtitle2">
                    {formatPrice(product.price)}
                  </Typography>
                  {product.compareAtPrice && (
                    <Typography
                      variant="caption"
                      className="line-through text-gray-500"
                    >
                      {formatPrice(product.compareAtPrice)}
                    </Typography>
                  )}
                </div>
              </TableCell>
              <TableCell align="center">
                <StockBadge product={product} />
              </TableCell>
              <TableCell align="center">
                <Tooltip title="View Details">
                  <IconButton onClick={() => onViewDetails(product)}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton onClick={() => onEdit(product)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    onClick={() => onDelete(product)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductTable;