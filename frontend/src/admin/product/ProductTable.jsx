import React, { memo } from 'react';
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
  Tooltip,
  Box
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ImageNotSupported as NoImageIcon
} from '@mui/icons-material';
import StockBadge from './StockBadge';

// Memoized ProductImage component for better performance
const ProductImage = memo(({ image, productName }) => {
  const [imageError, setImageError] = React.useState(false);
  
  if (!image?.url || imageError) {
    return (
      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
        <NoImageIcon className="text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={image.url}
      alt={productName}
      className="w-12 h-12 object-cover rounded-lg shadow-sm"
      onError={() => setImageError(true)}
      loading="lazy" // Enable lazy loading for images
    />
  );
});

// Memoized table cell components for better performance
const ProductInfoCell = memo(({ product }) => (
  <div className="flex items-center space-x-3">
    <div className="flex-shrink-0">
      <ProductImage 
        image={product.images?.[0]} 
        productName={product.name} 
      />
    </div>
    <div className="min-w-0 flex-1">
      <Typography 
        variant="subtitle2" 
        className="text-gray-900 font-medium truncate"
      >
        {product.name}
      </Typography>
      <Typography 
        variant="caption" 
        className="text-gray-500 line-clamp-1"
      >
        {product.shortDescription || 'No description'}
      </Typography>
    </div>
  </div>
));

const PriceCell = memo(({ price, compareAtPrice, formatPrice }) => (
  <div className="space-y-1">
    <Typography variant="subtitle2" className="text-gray-900">
      {formatPrice(price)}
    </Typography>
    {compareAtPrice && compareAtPrice > price && (
      <Typography
        variant="caption"
        className="line-through text-gray-500"
      >
        {formatPrice(compareAtPrice)}
      </Typography>
    )}
  </div>
));

const ActionButtons = memo(({ product, onViewDetails, onEdit, onDelete }) => (
  <div className="flex items-center justify-center space-x-1">
    <Tooltip title="View Details" arrow>
      <IconButton 
        onClick={() => onViewDetails(product)}
        className="text-blue-600 hover:text-blue-800"
        size="small"
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
    </Tooltip>

    <Tooltip title="Edit Product" arrow>
      <IconButton 
        onClick={() => onEdit(product)}
        className="text-indigo-600 hover:text-indigo-800"
        size="small"
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>

    <Tooltip title="Delete Product" arrow>
      <IconButton
        onClick={() => onDelete(product)}
        className="text-red-600 hover:text-red-800"
        size="small"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </div>
));

const EmptyState = memo(() => (
  <Box className="w-full p-8 text-center bg-white rounded-lg shadow-sm">
    <Typography variant="h6" className="text-gray-600 mb-2">
      No products found
    </Typography>
    <Typography variant="body2" className="text-gray-500">
      Try adjusting your search or filters
    </Typography>
  </Box>
));

// Main ProductTable component
const ProductTable = ({
  products = [],
  onEdit,
  onDelete,
  onViewDetails,
  formatPrice
}) => {
  if (!products.length) {
    return <EmptyState />;
  }

  return (
    <TableContainer 
      component={Paper} 
      className="mb-4 rounded-lg shadow-sm border border-gray-200"
    >
      <Table>
        <TableHead>
          <TableRow className="bg-gray-50">
            <TableCell className="font-semibold text-gray-700">Name</TableCell>
            <TableCell className="font-semibold text-gray-700">SKU</TableCell>
            <TableCell align="right" className="font-semibold text-gray-700">
              Price
            </TableCell>
            <TableCell align="center" className="font-semibold text-gray-700">
              Stock Status
            </TableCell>
            <TableCell align="center" className="font-semibold text-gray-700">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow 
              key={product._id} 
              hover 
              className="transition-colors duration-150"
            >
              <TableCell>
                <ProductInfoCell product={product} />
              </TableCell>

              <TableCell className="text-gray-600">
                {product.sku || 'N/A'}
              </TableCell>

              <TableCell align="right">
                <PriceCell 
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  formatPrice={formatPrice}
                />
              </TableCell>

              <TableCell align="center">
                <StockBadge product={product} />
              </TableCell>

              <TableCell align="center">
                <ActionButtons
                  product={product}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default memo(ProductTable);