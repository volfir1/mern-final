// CreateSubcategory.jsx
import React, { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, CircularProgress, Typography, Chip, Paper, Avatar,
  IconButton, Zoom, Fade, Slide
} from '@mui/material';
import {
  Category as CategoryIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Image as ImageIcon
} from '@mui/icons-material';

// Optimized ImagePreviewDialog Component
const ImagePreviewDialog = memo(({ open, onClose, imageUrl, title }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle className="flex justify-between items-center p-4">
      <div className="flex items-center gap-3">
        <Avatar className="bg-blue-100">
          <ImageIcon className="text-blue-500" />
        </Avatar>
        <Typography variant="h6" className="font-semibold">{title}</Typography>
      </div>
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent className="p-6">
      <img src={imageUrl} alt={title} className="w-full h-auto max-h-[600px] object-contain rounded-lg" />
    </DialogContent>
  </Dialog>
));

// Optimized ParentCategorySelector Component
const ParentCategorySelector = memo(({
  open, onClose, categories, onSelect, selectedId, isLoading
}) => (
  <Dialog 
    open={open} 
    onClose={onClose} 
    maxWidth="md" 
    fullWidth 
    TransitionComponent={Slide}
    TransitionProps={{ direction: "up" }}
  >
    <DialogTitle className="flex justify-between items-center p-4">
      <div className="flex items-center gap-3">
        <Avatar className="bg-blue-100">
          <CategoryIcon className="text-blue-500" />
        </Avatar>
        <div>
          <Typography variant="h6" className="font-semibold">
            Select Parent Category
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a category to create subcategory under
          </Typography>
        </div>
      </div>
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent className="p-6">
      <div className="grid grid-cols-2 gap-4">
        {categories?.map(category => (
          <Paper
            key={category._id}
            onClick={() => {
              onSelect(category);
              onClose();
            }}
            className={`
              p-4 cursor-pointer transition-all duration-200
              ${selectedId === category._id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-gray-200'}
              border-2 rounded-xl flex items-center gap-3
            `}
            elevation={selectedId === category._id ? 2 : 1}
          >
            <Avatar 
              src={category.image?.url}
              className={selectedId === category._id ? 'bg-blue-100' : 'bg-gray-100'}
            >
              <CategoryIcon className={selectedId === category._id ? 'text-blue-500' : 'text-gray-500'} />
            </Avatar>
            <div className="flex-1">
              <Typography className={`font-medium ${selectedId === category._id ? 'text-blue-700' : 'text-gray-700'}`}>
                {category.name}
              </Typography>
              {category.description && (
                <Typography variant="body2" className="text-gray-500 truncate">
                  {category.description}
                </Typography>
              )}
            </div>
          </Paper>
        ))}
      </div>
    </DialogContent>
  </Dialog>
));

// Main CreateSubcategory Component
const CreateSubcategory = memo(({
  open = false,
  onClose,
  onSubmit,
  existingCategories = [],
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const handleClose = useCallback(() => {
    setFormData({ name: '', description: '', image: null });
    setImagePreview('');
    setSelectedParentCategory(null);
    onClose();
  }, [onClose]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log('Input Change:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file);
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedParentCategory) return;
  
    try {
      const submissionData = {
        categoryId: selectedParentCategory._id,
        data: {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          image: formData.image || null
        }
      };
      
      console.log('CreateSubcategory submitting:', submissionData);
      
      if (!submissionData.data.name) {
        throw new Error('Name is required');
      }
  
      await onSubmit(submissionData);
      handleClose();
    } catch (error) {
      console.error('Submit error:', error);
    }
  }, [formData, onSubmit, selectedParentCategory, handleClose]);
  
  

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle className="flex justify-between items-center p-4">
            <div className="flex items-center gap-3">
              <Avatar className="bg-blue-100">
                <CategoryIcon className="text-blue-500" />
              </Avatar>
              <div>
                <Typography variant="h6" className="font-semibold">
                  Create New Subcategory
                </Typography>
                {selectedParentCategory && (
                  <Chip
                    icon={<CategoryIcon className="text-blue-500" />}
                    label={`Under: ${selectedParentCategory.name}`}
                    variant="outlined"
                    color="primary"
                    size="small"
                    className="mt-1"
                  />
                )}
              </div>
            </div>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent className="p-6">
            <div className="space-y-4">
              {!selectedParentCategory ? (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowCategorySelector(true)}
                  startIcon={<CategoryIcon />}
                  className="h-14"
                >
                  Select Parent Category
                </Button>
              ) : (
                <Zoom in>
                  <Paper className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={selectedParentCategory.image?.url} className="bg-blue-100">
                          <CategoryIcon className="text-blue-500" />
                        </Avatar>
                        <div>
                          <Typography className="font-medium">
                            {selectedParentCategory.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Parent Category
                          </Typography>
                        </div>
                      </div>
                      <Button
                        size="small"
                        onClick={() => setSelectedParentCategory(null)}
                        startIcon={<CloseIcon />}
                      >
                        Change
                      </Button>
                    </div>
                  </Paper>
                </Zoom>
              )}

              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading || !selectedParentCategory}
                required
                className="bg-white"
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                disabled={isLoading || !selectedParentCategory}
                className="bg-white"
              />

              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isLoading || !selectedParentCategory}
                  className="hidden"
                  id="subcategory-image-upload"
                />
                <label htmlFor="subcategory-image-upload" className="block">
                  <Button
                    component="span"
                    variant="outlined"
                    disabled={isLoading || !selectedParentCategory}
                    fullWidth
                    startIcon={<AddIcon />}
                    className="h-14"
                  >
                    Upload Image
                  </Button>
                </label>
                {imagePreview && (
                  <Fade in>
                    <Paper 
                      className="relative overflow-hidden rounded-xl cursor-pointer"
                      onClick={() => setShowImagePreview(true)}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <Typography className="text-white opacity-0 hover:opacity-100">
                          Click to preview
                        </Typography>
                      </div>
                    </Paper>
                  </Fade>
                )}
              </div>
            </div>
          </DialogContent>

          <DialogActions className="p-4">
            <Button onClick={handleClose} disabled={isLoading} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !selectedParentCategory}
              className="bg-blue-500 hover:bg-blue-600 px-6"
            >
              {isLoading ? (
                <CircularProgress size={24} className="text-white" />
              ) : (
                'Create Subcategory'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ParentCategorySelector
        open={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        categories={existingCategories}
        onSelect={setSelectedParentCategory}
        selectedId={selectedParentCategory?._id}
        isLoading={isLoading}
      />

      <ImagePreviewDialog
        open={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={imagePreview}
        title="Image Preview"
      />
    </>
  );
});

// PropTypes
CreateSubcategory.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  existingCategories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.shape({
        url: PropTypes.string,
      }),
      description: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool
};

ParentCategorySelector.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.object),
  onSelect: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  isLoading: PropTypes.bool
};

ImagePreviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  title: PropTypes.string
};

// Display Names
ParentCategorySelector.displayName = 'ParentCategorySelector';
ImagePreviewDialog.displayName = 'ImagePreviewDialog';
CreateSubcategory.displayName = 'CreateSubcategory';

export default CreateSubcategory;