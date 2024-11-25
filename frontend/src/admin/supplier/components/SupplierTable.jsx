import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Avatar,
  Skeleton,
  TablePagination,
  TableSortLabel,
  Chip
} from '@mui/material';
import { UserCircle } from 'lucide-react';
import SupplierActions from './SupplierActions';

const SupplierTable = ({
  suppliers = [],
  loading = false,
  error = null,
  totalItems = 0,
  currentPage = 1,
  itemsPerPage = 10,
  sortOrder = 'createdAt',
  sortDirection = 'desc',
  onEdit,
  onDelete,
  onPageChange,
  onLimitChange,
  onSort,
  onStatusToggle
}) => {
  // Debug logs
  useEffect(() => {
    console.log('SupplierTable mounted with props:', {
      suppliersCount: suppliers?.length,
      suppliers: suppliers,
      loading,
      totalItems,
      currentPage
    });
  }, [suppliers, loading, totalItems, currentPage]);

  // Loading state with skeletons
  if (loading) {
    return (
      <TableContainer component={Paper} className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(itemsPerPage)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box className="flex items-center gap-3">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div>
                      <Skeleton variant="text" width={150} />
                      <Skeleton variant="text" width={100} height={15} />
                    </div>
                  </Box>
                </TableCell>
                <TableCell><Skeleton variant="text" width={150} /></TableCell>
                <TableCell><Skeleton variant="text" width={200} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell align="right"><Skeleton variant="text" width={100} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <Box className="p-8 text-center bg-white rounded-lg shadow-sm">
        <Typography color="error" className="font-medium mb-2">
          Error loading suppliers
        </Typography>
        <Typography color="text.secondary" className="text-sm">
          {error}
        </Typography>
      </Box>
    );
  }

  // Empty state - Modified to be more verbose in debugging
  if (!suppliers || suppliers.length === 0) {
    console.log('No suppliers found:', { suppliers });
    return (
      <Box className="p-8 text-center bg-white rounded-lg shadow-sm">
        <Typography color="text.secondary">
          No suppliers found. Add your first supplier to get started.
        </Typography>
        <Typography variant="caption" color="text.secondary" className="mt-2 block">
          Debug info: {JSON.stringify({ totalItems, currentPage, itemsPerPage })}
        </Typography>
      </Box>
    );
  }

  // Helper function for address formatting
  const formatAddress = (supplier) => {
    const parts = [
      supplier.street,
      supplier.city,
      supplier.state,
      supplier.country,
      supplier.zipCode
    ].filter(Boolean);

    if (parts.length === 0) return 'No address provided';

    const mainAddress = parts.slice(0, 2).join(', ');
    const secondaryAddress = parts.slice(2).join(', ');

    return (
      <>
        <Typography className="text-sm text-gray-900">
          {mainAddress || 'No address'}
        </Typography>
        {secondaryAddress && (
          <Typography className="text-sm text-gray-500">
            {secondaryAddress}
          </Typography>
        )}
      </>
    );
  };

  // Sort handler
  const createSortHandler = (property) => () => {
    const isAsc = sortOrder === property && sortDirection === 'asc';
    onSort(property, isAsc ? 'desc' : 'asc');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortOrder === 'name'}
                  direction={sortOrder === 'name' ? sortDirection : 'asc'}
                  onClick={createSortHandler('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortOrder === 'email'}
                  direction={sortOrder === 'email' ? sortDirection : 'asc'}
                  onClick={createSortHandler('email')}
                >
                  Contact
                </TableSortLabel>
              </TableCell>
              <TableCell>Address</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortOrder === 'active'}
                  direction={sortOrder === 'active' ? sortDirection : 'asc'}
                  onClick={createSortHandler('active')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(suppliers) && suppliers.map((supplier) => (
              <TableRow 
                key={supplier._id}
                hover
                className="border-t"
              >
                {/* Name and Image Column */}
                <TableCell className="py-4">
                  <Box className="flex items-center gap-3">
                    {supplier.image ? (
                      <Avatar
                        src={supplier.image}
                        alt={supplier.name}
                        className="w-10 h-10"
                      />
                    ) : (
                      <Avatar className="w-10 h-10 bg-gray-100 text-gray-600">
                        {supplier.name?.charAt(0)?.toUpperCase() || <UserCircle />}
                      </Avatar>
                    )}
                    <div>
                      <Typography className="text-sm font-medium text-gray-900">
                        {supplier.name}
                      </Typography>
                      {supplier.description && (
                        <Typography 
                          className="text-sm text-gray-500"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            maxWidth: '300px'
                          }}
                        >
                          {supplier.description}
                        </Typography>
                      )}
                    </div>
                  </Box>
                </TableCell>

                {/* Contact Information */}
                <TableCell className="py-4">
                  <Typography className="text-sm text-gray-900">
                    {supplier.email}
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    {supplier.phone}
                  </Typography>
                </TableCell>

                {/* Address Information */}
                <TableCell className="py-4">
                  {formatAddress(supplier)}
                </TableCell>

                {/* Updated Status Cell */}
                <TableCell className="py-4">
                  <Chip
                    label={supplier.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={supplier.active ? 'success' : 'default'}
                    className={`${
                      supplier.active 
                        ? 'bg-green-100 text-green-800 cursor-pointer' 
                        : 'bg-gray-100 text-gray-800 cursor-pointer'
                    }`}
                    onClick={() => onStatusToggle(supplier)}
                  />
                </TableCell>

                {/* Actions */}
                <TableCell align="right" className="py-4">
                  <SupplierActions
                    supplier={supplier}
                    onEdit={() => onEdit(supplier)}
                    onDelete={() => onDelete(supplier)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <div className="border-t px-4 py-2">
        <TablePagination
          component="div"
          count={totalItems}
          page={Math.max(0, currentPage - 1)}
          onPageChange={(_, newPage) => onPageChange(newPage + 1)}
          rowsPerPage={itemsPerPage}
          onRowsPerPageChange={(event) => onLimitChange(parseInt(event.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="border-0"
        />
      </div>
    </div>
  );
};

SupplierTable.propTypes = {
  suppliers: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    image: PropTypes.string,
    description: PropTypes.string,
    street: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    country: PropTypes.string,
    zipCode: PropTypes.string,
    active: PropTypes.bool,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  })),
  loading: PropTypes.bool,
  error: PropTypes.string,
  totalItems: PropTypes.number,
  currentPage: PropTypes.number,
  itemsPerPage: PropTypes.number,
  sortOrder: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onLimitChange: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  onStatusToggle: PropTypes.func.isRequired
};

export default React.memo(SupplierTable);