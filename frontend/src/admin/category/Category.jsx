// src/admin/category/Category.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Snackbar, Alert } from '@mui/material';
import Sidebar from "../../components/sidebar/Sidebar";
import useCategory from '@/hooks/category';
import CategoryList from './components/CategoryList';
import CategoryHeader from './CategoryHeader';
import Search from './components/Search';
import {
  CreateDialog,
  DeleteDialog as DeleteConfirmDialog,
  EditDialog,
  CreateSubcategory,
} from '@/components/dialog/category';

const Category = () => {
  const {
    categories,
    selectedItem,
    dialogState,
    editType,
    searchTerm,
    snackbar,
    isLoading,
    handleSearch,
    handleEdit,
    handleDelete,
    closeAllDialogs,
    closeSnackbar,
    setDialogState,
    setSelectedItem,
    refetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useCategory();

  const handleAddSubcategory = (categoryId) => {
    setDialogState(prev => ({ 
      ...prev, 
      createSub: true 
    }));
    if (categoryId) {
      setSelectedItem({ _id: categoryId });
    }
  };

  const isActionInProgress = 
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending ||
    createSubcategory.isPending ||
    updateSubcategory.isPending ||
    deleteSubcategory.isPending;

  const filteredCategories = useMemo(() => 
    categories ? categories.filter(category =>
      category.name.toLowerCase().includes((searchTerm || '').toLowerCase())
    ) : []
  , [categories, searchTerm]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-20">
        <div className="p-6 max-w-[1400px] mx-auto">
          <CategoryHeader
            onAddNew={() => setDialogState(prev => ({ ...prev, create: true }))}
            onRefresh={refetchCategories}
            onAddSubcategory={handleAddSubcategory}
            isLoading={isLoading}
          />

          <Search
            value={searchTerm}
            onChange={handleSearch}
            disabled={isLoading || isActionInProgress}
          />

          <CategoryList
            categories={filteredCategories}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddSubcategory={handleAddSubcategory}
            onSubcategoryEdit={(subcategory) => {
              handleEdit(subcategory, 'subcategory');
            }}
            onSubcategoryDelete={(subcategory) => {
              if (!subcategory || !subcategory.category) {
                console.error('Invalid subcategory data:', subcategory);
                return;
              }
              handleDelete(subcategory, subcategory.category);
            }}
            disableActions={isLoading || isActionInProgress}
          />

          <CreateDialog
            open={dialogState.create}
            onClose={closeAllDialogs}
            onSubmit={createCategory.mutate}
            isLoading={createCategory.isPending}
          />

          <CreateSubcategory
            open={dialogState.createSub}
            onClose={closeAllDialogs}
            onSubmit={(formData) => {
              if (!formData || !formData.categoryId) {
                console.error('Missing required data for subcategory creation');
                return;
              }
              createSubcategory.mutate({
                categoryId: formData.categoryId,
                data: formData.data
              });
            }}
            existingCategories={filteredCategories}
            selectedCategoryId={selectedItem?._id}
            isLoading={createSubcategory.isPending}
          />

          <EditDialog
            open={dialogState.edit}
            onClose={closeAllDialogs}
            onSubmit={(data) => {
              if (editType === 'subcategory') {
                if (!selectedItem?.category) {
                  console.error('Missing category ID for subcategory update');
                  return;
                }
                updateSubcategory.mutate({
                  categoryId: selectedItem.category,
                  subcategoryId: selectedItem._id,
                  data
                });
              } else {
                updateCategory.mutate({
                  id: selectedItem._id,
                  data
                });
              }
            }}
            item={selectedItem}
            type={editType}
            isLoading={updateCategory.isPending || updateSubcategory.isPending}
          />

          <DeleteConfirmDialog
            open={dialogState.delete}
            onClose={closeAllDialogs}
            onConfirm={() => {
              if (editType === 'subcategory') {
                if (!selectedItem?.category) {
                  console.error('Missing category ID for subcategory deletion');
                  return;
                }
                deleteSubcategory.mutate({
                  categoryId: selectedItem.category,
                  subcategoryId: selectedItem._id
                });
              } else {
                deleteCategory.mutate(selectedItem._id);
              }
            }}
            itemName={selectedItem?.name}
            type={editType}
            isLoading={deleteCategory.isPending || deleteSubcategory.isPending}
          />

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={closeSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              onClose={closeSnackbar}
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