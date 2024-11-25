import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Alert,
  Snackbar,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  SupplierTable,
  SupplierForm,
  SupplierHeader,
} from './index';
import DeleteDialog from '@/components/dialog/supplier/DeleteDialog';
import { useSupplier } from '@/hooks/supplier';

// Add initial form state constants
const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  phone: '',
  description: '',
  street: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  status: 'active', // Default to active
  countryData: null,
  image: null
};

const SupplierList = () => {
  const {
    // Data states
    suppliers,
    totalItems,
    currentPage,
    itemsPerPage,
    sortOrder,
    sortDirection,
    
    // UI states
    loading,
    error,
    formDialog,
    deleteDialog,
    selectedSupplier,
    searchQuery,
    activeFilters,
    formData = INITIAL_FORM_STATE, // Set default form data
    formErrors,
    submitting,
    imagePreview,
    stats,

    // Message states
    notification,
    setNotification,
    
    // Action handlers
    setFormDialog,
    setDeleteDialog,
    setSelectedSupplier,
    handleSearchChange,
    handleFilterChange,
    handleFormChange,
    handleSubmit,
    handleDelete,
    handleEdit,
    handleCloseForm,
    handlePageChange,
    handleLimitChange,
    handleSort,
    handleRefresh,
    handleExport,
    handleImageChange,
  } = useSupplier(1, 10, INITIAL_FORM_STATE); // Pass initial form state to hook

  // Add debug logging
  useEffect(() => {
    console.log('SupplierList state:', {
      supplierCount: suppliers?.length,
      totalItems,
      currentPage,
      loading,
      error
    });
  }, [suppliers, totalItems, currentPage, loading, error]);

  // Force initial load
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleNotificationClose = useCallback(() => {
    setNotification(null);
  }, [setNotification]);

  const handleImageDelete = useCallback(() => {
    handleFormChange({
      target: {
        name: 'image',
        value: null
      }
    });
  }, [handleFormChange]);

  const handleDeleteClick = useCallback((supplier) => {
    setSelectedSupplier(supplier);
    setDeleteDialog(true);
  }, [setSelectedSupplier, setDeleteDialog]);

  return (
    <Box className="space-y-6">
      {/* Loading Progress */}
      {loading && (
        <LinearProgress 
          className="absolute top-0 left-0 right-0 z-50" 
          color="primary" 
        />
      )}

      {/* Header Section */}
      <Paper className="p-6 ml-20 bg-white rounded-lg shadow-sm">
        <SupplierHeader
          onAdd={() => setFormDialog(true)}
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          totalItems={totalItems}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
          onExport={handleExport}
          loading={loading}
          stats={stats}
        />
      </Paper>

      {/* Error Display */}
      {error && !loading && (
        <Alert 
          severity="error" 
          className="mb-4"
          onClose={() => setNotification(null)}
        >
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper className="overflow-hidden rounded-lg ml-0 ml-16">
        <SupplierTable
          suppliers={suppliers}
          loading={loading}
          error={error}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          sortOrder={sortOrder}
          sortDirection={sortDirection}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onSort={handleSort}
        />
      </Paper>

      {/* Supplier Form Dialog */}
      {formDialog && (
        <SupplierForm
          open={formDialog}
          onClose={handleCloseForm}
          formData={formData}
          formErrors={formErrors}
          submitting={submitting}
          selectedSupplier={selectedSupplier}
          handleFormChange={handleFormChange}
          handleSubmit={handleSubmit}
          handleImageChange={handleImageChange}
          handleImageDelete={handleImageDelete}
          imagePreview={imagePreview}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <DeleteDialog
          open={deleteDialog}
          onClose={() => {
            setDeleteDialog(false);
            setSelectedSupplier(null);
          }}
          onConfirm={async () => {
            await handleDelete();
            setDeleteDialog(false);
            setSelectedSupplier(null);
          }}
          loading={submitting}
          title="Delete Supplier"
          message={
            selectedSupplier
              ? `Are you sure you want to delete ${selectedSupplier.name}? This action cannot be undone.`
              : 'Are you sure you want to delete this supplier?'
          }
        />
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert 
            onClose={handleNotificationClose}
            severity={notification.type || 'info'}
            variant="filled"
            className="w-full"
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default SupplierList;