import React, { memo, useState, useEffect,useCallback } from "react";
import PropTypes from "prop-types";
import { categoryApi } from "@/api/categoryApi";
import {
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Zoom,
  Fade,
  CircularProgress
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Category as CategoryIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

const CategoryCard = memo(
  ({
    category,
    onEdit,
    onCategoryDelete = () => {},
    onSubcategoryDelete = () => {},
    onSubcategoryEdit = () => {},
    disableActions = false,
  }) => {
    console.log('Category data:', category);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [isSubcategoryDetailOpen, setIsSubcategoryDetailOpen] = useState(false);
  const [categorySubcategories, setCategorySubcategories] = useState([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);

   // fetch subcategories
   const fetchSubcategories = useCallback(async () => {
    if (!category?._id) return;
    
    try {
      setIsLoadingSubcategories(true);
      console.log('Fetching subcategories for category:', category._id);
      
      const response = await categoryApi.getSubcategoriesByCategory(category._id);
      console.log('Fetched subcategories response:', response);
      
      if (response.data?.success) {
        const subcategories = response.data.data.map(sub => ({
          ...sub,
          image: sub.image || {
            url: sub.imageUrl,
            publicId: sub.imagePublicId
          }
        }));
        console.log('Processed subcategories:', subcategories);
        setCategorySubcategories(subcategories);
      } else {
        console.warn('No subcategories data in response');
        setCategorySubcategories([]);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setCategorySubcategories([]);
    } finally {
      setIsLoadingSubcategories(false);
    }
  }, [category._id]);

   //  fetch subcategories when dialog opens
   useEffect(() => {
    if (isInfoOpen) {
      fetchSubcategories();
    }
  }, [isInfoOpen, fetchSubcategories]);

  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showActions && !event.target.closest(".actions-container")) {
          setShowActions(false);
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, [showActions]);

    const subcategoryCount = category.metadata?.subcategoryCount || 0;
    const productCount = category.metadata?.productCount || 0;
    if (!category) return null;

    return (
      <>
        <Card className="relative h-72 overflow-hidden transition-all duration-300 hover:shadow-xl rounded-xl">
          {/* Background Image/Icon */}
          <div className="absolute inset-0">
          {category.image?.url ? (
            <img
              src={category.image.url}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-600 flex items-center justify-center">
              <CategoryIcon sx={{ fontSize: 96, color: "white" }} />
            </div>
          )}
        </div>

          {/* Content */}
          <CardContent className="relative h-full z-10 flex flex-col p-6">
            {/* Header */}
            <div className="flex justify-between items-start">
            <Typography
              variant="h5"
              className="text-white font-bold tracking-wide flex-1 mr-4"
              sx={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
            >
              {category.name}
            </Typography>
            <Chip
              label={`${productCount} Products`}
              className="bg-green-500 text-white shadow-md"
              size="small"
            />
          </div>

            {/* Actions */}
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setIsInfoOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-md"
                startIcon={<InfoIcon />}
                size="small"
                disabled={disableActions}
              >
                View Info
              </Button>

              <div className="ml-auto relative actions-container">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                  className="bg-white hover:bg-gray-100 shadow-md"
                  size="small"
                  disabled={disableActions}
                >
                  <MoreVertIcon />
                </IconButton>

                <Fade in={showActions}>
                  <div className="absolute right-0 bottom-full mb-2 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg z-50">
                    <Zoom
                      in={showActions}
                      style={{ transitionDelay: showActions ? "100ms" : "0ms" }}
                    >
                      <Button
                        onClick={() => {
                          onEdit();
                          setShowActions(false);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white normal-case"
                        startIcon={<EditIcon />}
                        size="small"
                        fullWidth
                      >
                        Edit
                      </Button>
                    </Zoom>
                    <Zoom
                      in={showActions}
                      style={{ transitionDelay: showActions ? "150ms" : "0ms" }}
                    >
                      <Button
                        onClick={() => {
                          onCategoryDelete(category); // Pass the entire category object
                          setShowActions(false);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white normal-case"
                        startIcon={<DeleteIcon />}
                        size="small"
                        fullWidth
                      >
                        Delete 
                      </Button>
                    </Zoom>
                  </div>
                </Fade>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Info Dialog */}
        <Dialog
        open={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "rounded-xl",
        }}
      >
          <DialogTitle className="flex justify-between items-center border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={category.image?.url}
                className="w-12 h-12 border-2 border-gray-200"
              >
                <CategoryIcon />
              </Avatar>
              <div>
                <Typography variant="h6" className="font-semibold">
                  {category.name}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Category Information
                </Typography>
              </div>
            </div>
            <IconButton onClick={() => setIsInfoOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent className="p-6">
          <div className="flex gap-6">
            {/* Left side - Category Details */}
            <div className="flex-1 border-r pr-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Typography variant="subtitle2" className="text-gray-600 mb-1">
                    Total Products
                  </Typography>
                  <Typography variant="h6">{productCount}</Typography>
                </div>
                <div>
                  <Typography variant="subtitle2" className="text-gray-600 mb-1">
                    Subcategories
                  </Typography>
                  <Typography variant="h6">{subcategoryCount}</Typography>
                </div>
              </div>

                {category.description && (
                  <div className="mb-6">
                    <Typography
                      variant="subtitle2"
                      className="text-gray-600 mb-1"
                    >
                      Description
                    </Typography>
                    <Typography>{category.description}</Typography>
                  </div>
                )}

                {category.image?.url && (
                  <div>
                    <Typography
                      variant="subtitle2"
                      className="text-gray-600 mb-1"
                    >
                      Category Image
                    </Typography>
                    <img
                      src={category.image.url}
                      alt={category.name}
                      className="w-full h-40 object-cover rounded-lg mt-2"
                    />
                  </div>
                )}
              </div>

              {/* Right side - Subcategories */}
              <div className="flex-1 pl-6">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="subtitle2" className="text-gray-600">
                  Subcategories ({subcategoryCount})
                </Typography>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {isLoadingSubcategories ? (
                  <div className="flex justify-center py-8">
                    <CircularProgress size={24} />
                  </div>
                ) : categorySubcategories.length > 0 ? (
                  categorySubcategories.map((subcategory) => (
                    <div
                      key={subcategory._id}
                      className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 group transition-colors border border-gray-100"
                    >
                      <Avatar
                        src={subcategory.image?.url}
                        className="w-10 h-10 bg-blue-100"
                      >
                        <CategoryIcon className="text-blue-500" />
                      </Avatar>
                      
                      <div className="flex-1">
                        <Typography className="font-medium">
                          {subcategory.name}
                        </Typography>
                        {subcategory.description && (
                          <Typography variant="body2" className="text-gray-500 line-clamp-1">
                            {subcategory.description}
                          </Typography>
                        )}
                      </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedSubcategory(subcategory);
                      setIsSubcategoryDetailOpen(true);
                    }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    className="text-amber-500 hover:bg-amber-50"
                    onClick={() => onSubcategoryEdit(subcategory)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => onSubcategoryDelete(subcategory)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CategoryIcon className="text-gray-400 mb-2" sx={{ fontSize: 48 }} />
          <Typography className="text-gray-500">
            No subcategories found
          </Typography>
          <Typography variant="body2" className="text-gray-400">
            Add subcategories to organize your products
          </Typography>
        </div>
        )}
      </div>
    </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Subcategory Detail Dialog */}
        <Dialog
          open={isSubcategoryDetailOpen}
          onClose={() => setIsSubcategoryDetailOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            className: "rounded-xl",
          }}
        >
          {selectedSubcategory && (
            <>
              <DialogTitle className="flex justify-between items-center border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedSubcategory.image?.url}
                    className="w-10 h-10"
                  >
                    <CategoryIcon />
                  </Avatar>
                  <div>
                    <Typography variant="h6" className="font-semibold">
                      {selectedSubcategory.name}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Subcategory Details
                    </Typography>
                  </div>
                </div>
                <IconButton onClick={() => setIsSubcategoryDetailOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent className="p-6">
                {selectedSubcategory.description && (
                  <Typography className="mt-2 mb-4">
                    {selectedSubcategory.description}
                  </Typography>
                )}
                {selectedSubcategory.image?.url && (
                  <img
                    src={selectedSubcategory.image.url}
                    alt={selectedSubcategory.name}
                    className="w-full h-48 object-cover rounded-lg mt-4"
                  />
                )}
              </DialogContent>
            </>
          )}
        </Dialog>
      </>
    );
  }
);
CategoryCard.propTypes = {
  category: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    image: PropTypes.shape({
      url: PropTypes.string,
      publicId: PropTypes.string,
    }),
    slug: PropTypes.string,
    isActive: PropTypes.bool,
    orderIndex: PropTypes.number,
    metadata: PropTypes.shape({
      subcategoryCount: PropTypes.number,
      productCount: PropTypes.number,
      lastSubcategoryAdded: PropTypes.string,
    }),
    subcategories: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        image: PropTypes.shape({
          url: PropTypes.string,
          publicId: PropTypes.string,
        }),
        slug: PropTypes.string,
        isActive: PropTypes.bool,
        orderIndex: PropTypes.number,
        category: PropTypes.string,
        metadata: PropTypes.shape({
          productCount: PropTypes.number
        }),
        createdAt: PropTypes.string,
        updatedAt: PropTypes.string
      })
    )
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onCategoryDelete: PropTypes.func.isRequired,
  onSubcategoryDelete: PropTypes.func.isRequired,
  onSubcategoryEdit: PropTypes.func.isRequired,
  disableActions: PropTypes.bool,
};

CategoryCard.displayName = "CategoryCard";

export default CategoryCard;