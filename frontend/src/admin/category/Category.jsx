// src/admin/category/Category.jsx
import React, { useState, useCallback, useMemo } from 'react';
import Sidebar from "../../components/sidebar/Sidebar";
import { useCategories } from '../../hooks/category';

import {
  CircularProgress,
  Typography,
  Snackbar,
  Alert,
  Button,
} from '@mui/material';

import {
  CreateDialog,
  DeleteDialog as DeleteConfirmDialog,
  EditDialog,
  CreateSubcategory,
} from '../../components/dialog/category';

import {
  CategoryGrid,
  CategoryHeader,
  Search as CategorySearch,
} from './';

const Category = () => {
  // States
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogState, setDialogState] = useState({
    create: false,
    edit: false,
    delete: false,
    createSub: false,
  });
  const [editType, setEditType] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Hook usage
  const {
    categories,
    isLoading,
    error,
    refetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useCategories(setSnackbar);

  // Computed Values
  const handleEdit = useCallback((item, type) => {
    if (!item?._id) {
      setSnackbar({
        open: true,
        message: 'Invalid item selected for editing',
        severity: 'error'
      });
      return;
    }

    // If type is not explicitly passed, determine it based on parentId
    const itemType = type || (item.parentId ? 'subcategory' : 'category');

    // For subcategories, ensure we have the parent category reference
    if (itemType === 'subcategory' && !item.parentId) {
      setSnackbar({
        open: true,
        message: 'Parent category information is missing',
        severity: 'error'
      });
      return;
    }

    setSelectedItem(item);
    setEditType(itemType);
    setDialogState(prev => ({ ...prev, edit: true }));
  }, []);

  const filteredCategories = useMemo(() => {
    if (!categories?.length) return [];
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const isActionInProgress = useMemo(() => (
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending ||
    createSubcategory.isPending ||
    updateSubcategory.isPending ||
    deleteSubcategory.isPending ||
    refreshing
  ), [
    createCategory.isPending,
    updateCategory.isPending,
    deleteCategory.isPending,
    createSubcategory.isPending,
    updateSubcategory.isPending,
    deleteSubcategory.isPending,
    refreshing
  ]);

  // Utility functions
  const getParentCategoryName = useCallback((item) => {
    if (!item?.parentId || !categories) return '';
    const parentCategory = categories.find(cat => cat._id === item.parentId);
    return parentCategory?.name || '';
  }, [categories]);

  const closeAllDialogs = useCallback(() => {
    setDialogState({
      create: false,
      createSub: false,
      edit: false,
      delete: false
    });
    setSelectedItem(null);
    setEditType(null);
  }, []);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetchCategories();
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // CRUD handlers
  const handleCreate = useCallback(async ({ formData, type, parentId }) => {
    try {
      if (type === 'subcategory') {
        if (!parentId) {
          setSnackbar({
            open: true,
            message: 'Parent category is required for subcategory',
            severity: 'error'
          });
          return;
        }
        await createSubcategory.mutate({
          categoryId: parentId,
          data: formData
        });
      } else {
        await createCategory.mutate(formData);
      }
      closeAllDialogs();
    } catch (error) {
      console.error('Creation failed:', error);
    }
  }, [createCategory, createSubcategory, closeAllDialogs]);

  const handleUpdate = useCallback(async (formData) => {
    if (!selectedItem?._id) {
      setSnackbar({
        open: true,
        message: `Invalid ${editType || 'item'} selected for update`,
        severity: 'error'
      });
      return;
    }

    try {
      if (editType === 'subcategory') {
        await updateSubcategory.mutate({
          categoryId: selectedItem.parentId,
          subcategoryId: selectedItem._id,
          data: formData
        });
      } else {
        await updateCategory.mutate({
          id: selectedItem._id,
          data: formData
        });
      }
      closeAllDialogs();
    } catch (error) {
      console.error('Update failed:', error);
    }
  }, [updateCategory, updateSubcategory, selectedItem, editType, closeAllDialogs]);

  const handleDelete = useCallback((item, parentCategoryId = null) => {
    const itemType = parentCategoryId ? 'subcategory' : 'category';

    if (!item?._id) {
      setSnackbar({
        open: true,
        message: `Invalid ${itemType} selected for deletion`,
        severity: 'error'
      });
      return;
    }

    setSelectedItem({
      ...item,
      parentId: parentCategoryId,
    });
    setEditType(itemType);
    setDialogState(prev => ({ ...prev, delete: true }));
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedItem?._id) {
      setSnackbar({
        open: true,
        message: 'Invalid item selected for deletion',
        severity: 'error'
      });
      return;
    }

    try {
      if (editType === 'subcategory') {
        await deleteSubcategory.mutate({
          categoryId: selectedItem.parentId,
          subcategoryId: selectedItem._id
        });
      } else {
        await deleteCategory.mutate(selectedItem._id);
      }
      closeAllDialogs();
    } catch (error) {
      console.error('Delete operation failed:', error);
    }
  }, [selectedItem, editType, deleteCategory, deleteSubcategory, closeAllDialogs]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-20">
        <div className="p-6 max-w-[1400px] mx-auto">
          <CategoryHeader
            onAddNew={() => setDialogState(prev => ({ ...prev, create: true }))}
            onRefresh={handleRefresh}
            onAddSubcategory={(categoryId) => {
              setSelectedItem({ _id: categoryId });
              setEditType('subcategory');
              setDialogState(prev => ({ ...prev, createSub: true }));
            }}
            isLoading={isLoading || refreshing}
            selectedCategoryId={selectedItem?._id}
          />

          <CategorySearch
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={isLoading || isActionInProgress}
          />

          <CategoryGrid
            categories={filteredCategories}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddSubcategory={(categoryId) => {
              setSelectedItem({ _id: categoryId });
              setEditType('subcategory');
              setDialogState(prev => ({ ...prev, createSub: true }));
            }}
            onSubcategoryEdit={(subcategory) => handleEdit(subcategory, 'subcategory')}
            onSubcategoryDelete={(subcategory) => handleDelete(subcategory, subcategory.parentCategory._id)}
            disableActions={isLoading || isActionInProgress}
          />

          {/* Dialogs */}
          <CreateDialog
            open={dialogState.create}
            onClose={closeAllDialogs}
            onSubmit={handleCreate}
            isLoading={createCategory.isPending}
          />

          <CreateSubcategory
            open={dialogState.createSub}
            onClose={closeAllDialogs}
            onSubmit={handleCreate}
            existingCategories={categories}
            selectedCategoryId={selectedItem?._id}
            isLoading={createSubcategory.isPending}
          />

          <EditDialog
            open={dialogState.edit}
            onClose={closeAllDialogs}
            onSubmit={handleUpdate}
            item={selectedItem}
            type={editType}
            existingCategories={categories}
            isLoading={updateCategory.isPending || updateSubcategory.isPending}
          />

          <DeleteConfirmDialog
            open={dialogState.delete}
            onClose={closeAllDialogs}
            onConfirm={handleDeleteConfirm}
            itemName={selectedItem?.name}
            type={editType}
            isLoading={deleteCategory.isPending || deleteSubcategory.isPending}
            parentCategoryName={editType === 'subcategory' ? getParentCategoryName(selectedItem) : ''}
          />

          {/* Notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
              severity={snackbar.severity}
              elevation={6}
              variant="filled"
              className="shadow-lg"
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </div>
      </div>
    </div>
  );
};

export default Category;