// src/components/products/ProductDetailsDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import StockBadge from './StockBadge';

const ProductDetailsDialog = ({ open, handleClose, product, formatPrice }) => {
  if (!product) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <div className="flex justify-between items-center">
          <Typography variant="h6">Product Details</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent dividers>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images Section */}
          <div className="space-y-4">
            <Typography variant="subtitle1" className="font-semibold">
              Product Images
            </Typography>
            <div className="grid grid-cols-2 gap-2">
              {product.images && product.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg border"
                />
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle1" className="font-semibold">
                Basic Information
              </Typography>
              <div className="space-y-2 mt-2">
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Name
                  </Typography>
                  <Typography>{product.name}</Typography>
                </div>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    SKU
                  </Typography>
                  <Typography>{product.sku || 'N/A'}</Typography>
                </div>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Price
                  </Typography>
                  <div className="flex gap-2 items-center">
                    <Typography>{formatPrice(product.price)}</Typography>
                    {product.compareAtPrice && (
                      <Typography
                        variant="caption"
                        className="line-through text-gray-500"
                      >
                        {formatPrice(product.compareAtPrice)}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Typography variant="subtitle1" className="font-semibold">
                Categories
              </Typography>
              <div className="space-y-2 mt-2">
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Main Category
                  </Typography>
                  <Typography>
                    {product.category?.name || 'No category'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Subcategories
                  </Typography>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.subcategories?.length > 0 ? (
                      product.subcategories.map((sub, index) => (
                        <Chip
                          key={index}
                          label={sub.name}
                          size="small"
                          className="m-1"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No subcategories
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Typography variant="subtitle1" className="font-semibold">
                Stock Information
              </Typography>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <StockBadge product={product} />
                  <Typography variant="body2">
                    {product.stockQuantity} units available
                  </Typography>
                </div>
                {product.lowStockThreshold && (
                  <Typography variant="caption" color="textSecondary">
                    Low stock alert at {product.lowStockThreshold} units
                  </Typography>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full Description Section */}
        <div className="mt-6">
          <Typography variant="subtitle1" className="font-semibold">
            Description
          </Typography>
          <Paper className="p-4 mt-2 bg-gray-50">
            <Typography variant="body2" className="whitespace-pre-wrap">
              {product.description || 'No description available'}
            </Typography>
          </Paper>
        </div>

        {/* Specifications */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="mt-6">
            <Typography variant="subtitle1" className="font-semibold mb-2">
              Specifications
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {product.specifications.map((spec, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium w-1/3">
                        {spec.name}
                      </TableCell>
                      <TableCell>{spec.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="mt-6">
            <Typography variant="subtitle1" className="font-semibold mb-2">
              Tags
            </Typography>
            <div className="flex flex-wrap gap-1">
              {product.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  className="m-1"
                />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;