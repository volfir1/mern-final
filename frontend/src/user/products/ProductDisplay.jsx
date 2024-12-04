import React, { useState, useEffect, useCallback, Suspense, memo } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TablePagination,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Skeleton,
  Card,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Rating,
  CardMedia,
  Avatar,
} from "@mui/material";
import {
  Close as CloseIcon,
  Star as StarIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { format } from "date-fns";
import { productApi } from "@/api/productApi";
import { cartApi } from "@/api/cartApi";
import { useReviewApi } from "@/api/reviewApi";
import { useAuth } from "@/utils/authContext";
import Navbar from "@/components/navbar/Navbar";
import ErrorBoundary from "@/utils/errorBoundary";

// ReviewStars Component
const ReviewStars = memo(({ rating }) => (
  <Box className="flex items-center">
    <Rating
      value={rating}
      readOnly
      precision={0.5}
      size="small"
      sx={{
        "& .MuiRating-iconFilled": {
          color: "#6366f1",
        },
        "& .MuiRating-iconEmpty": {
          color: "#e2e8f0",
        },
      }}
      emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
    />
  </Box>
));

// ReviewCard Component
const ReviewCard = memo(({ review, onEdit }) => (
  <Box className="mb-6 p-4 bg-white rounded-none border-l-4 border-indigo-500 shadow-sm">
    <Box className="flex justify-between items-start mb-3">
      <Box className="flex items-center gap-3">
        <Avatar
          src={review.user?.photoURL}
          alt={review.user?.displayName || review.user?.email}
          className="w-8 h-8 bg-indigo-100"
        >
          {(review.user?.displayName || review.user?.email)?.charAt(0) || "?"}
        </Avatar>
        <Box>
          <Typography
            variant="subtitle2"
            className="font-sans font-medium tracking-wide"
          >
            {review.user?.displayName || review.user?.email || "Anonymous"}
          </Typography>
          <Typography variant="caption" className="text-slate-600">
            Order #{review.order?.orderNumber} •{" "}
            {format(new Date(review.createdAt), "MMM dd, yyyy")}
          </Typography>
        </Box>
      </Box>
      {review.user?._id === review.order?.userId && (
        <Button
          size="small"
          startIcon={<EditIcon />}
          className="text-indigo-600 hover:text-indigo-800"
          onClick={() => onEdit(review)}
        >
          Edit
        </Button>
      )}
    </Box>
    <ReviewStars rating={review.rating} />
    <Typography variant="body2" className="mt-3 text-slate-700 leading-relaxed">
      {review.comment}
    </Typography>
  </Box>
));

// ReviewModal Component
const ReviewModal = memo(
  ({ open, onClose, product, reviews = [], loading = false, onEditReview }) => {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "rounded-none border-t-4 border-indigo-500",
        }}
      >
        <DialogTitle className="bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <Typography
            variant="h6"
            className="font-sans font-medium tracking-wide"
          >
            Reviews for {product?.name}
          </Typography>
          <IconButton
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            edge="end"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="py-6">
          {loading ? (
            <Box className="flex justify-center p-8">
              <CircularProgress className="text-indigo-500" />
            </Box>
          ) : reviews?.length > 0 ? (
            <Box className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  onEdit={onEditReview}
                />
              ))}
            </Box>
          ) : (
            <Box className="py-12 text-center">
              <Typography className="text-slate-500">No reviews yet</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="border-t border-slate-200 bg-slate-50">
          <Button
            onClick={onClose}
            className="text-slate-700 hover:text-slate-900"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

// EditReviewDialog Component
const EditReviewDialog = memo(({ open, onClose, review, onUpdate }) => {
  const [editedReview, setEditedReview] = useState({ rating: 0, comment: "" });
  const [loading, setLoading] = useState(false);
  const reviewApi = useReviewApi();

  useEffect(() => {
    if (review) {
      setEditedReview({ rating: review.rating, comment: review.comment });
    }
  }, [review]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await reviewApi.updateReview(review._id, {
        rating: editedReview.rating,
        comment: editedReview.comment,
      });
      if (response.success) {
        toast.success("Review updated successfully");
        onUpdate(response.data);
        onClose();
      } else {
        throw new Error(response.message || "Failed to update review");
      }
    } catch (error) {
      console.error("Update review error:", error);
      toast.error(error.message || "Failed to update review");
    } finally {
      setLoading(false);
    }
  };

  if (!review) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "rounded-none border-t-4 border-indigo-500",
      }}
    >
      <DialogTitle className="bg-slate-50 border-b border-slate-200">
        <Typography
          variant="h6"
          className="font-sans font-medium tracking-wide"
        >
          Edit Your Review
        </Typography>
      </DialogTitle>
      <DialogContent className="py-6">
        <Box className="space-y-6">
          <Box className="flex flex-col gap-2">
            <Typography className="text-slate-600 font-medium">
              Rating
            </Typography>
            <Rating
              name="rating"
              value={editedReview.rating}
              onChange={(_, newValue) => {
                setEditedReview((prev) => ({ ...prev, rating: newValue }));
              }}
              sx={{
                "& .MuiRating-iconFilled": {
                  color: "#6366f1",
                },
                "& .MuiRating-iconEmpty": {
                  color: "#e2e8f0",
                },
              }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Review"
            value={editedReview.comment}
            onChange={(e) => {
              setEditedReview((prev) => ({ ...prev, comment: e.target.value }));
            }}
            className="bg-white"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "0",
                "&:hover fieldset": {
                  borderColor: "#6366f1",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#6366f1",
                  borderWidth: "2px",
                },
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions className="border-t border-slate-200 bg-slate-50 p-4">
        <Button
          onClick={onClose}
          disabled={loading}
          className="text-slate-600 hover:text-slate-800"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-none normal-case"
        >
          {loading ? (
            <CircularProgress size={24} className="text-white" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// ProductGridSkeleton Component
const ProductGridSkeleton = memo(() => (
  <Grid container spacing={4}>
    {[...Array(6)].map((_, index) => (
      <Grid item key={index} xs={12} sm={6} md={4}>
        <Card className="rounded-none border-t-4 border-slate-200">
          <Skeleton
            variant="rectangular"
            height={240}
            className="bg-slate-100"
          />
          <Box className="p-4 space-y-2">
            <Skeleton width="60%" height={28} className="bg-slate-100" />
            <Skeleton width="40%" height={20} className="bg-slate-100" />
            <Skeleton width="20%" height={20} className="bg-slate-100" />
          </Box>
        </Card>
      </Grid>
    ))}
  </Grid>
));

// LoadingSpinner Component
const LoadingSpinner = memo(() => (
  <Box className="flex justify-center py-12">
    <CircularProgress size={40} className="text-indigo-500" />
  </Box>
));

// EmptyState Component
const EmptyState = memo(() => (
  <Box className="flex flex-col items-center justify-center min-h-[400px] py-12">
    <Typography variant="h6" className="text-slate-600 font-medium mb-2">
      No products found
    </Typography>
    <Typography variant="body2" className="text-slate-500">
      Try adjusting your search or filters
    </Typography>
  </Box>
));

// ProductGrid Component
const ProductGrid = memo(
  ({ products, onAddToCart, reviews, loadingReviews, onOpenReviews }) => {
    if (!products || products.length === 0) {
      return <EmptyState />;
    }

    return (
      <Grid container spacing={4}>
        {products.map((product) => (
          <Grid item key={product._id} xs={12} sm={6} md={4}>
            <Card className="rounded-none hover:shadow-lg transition-shadow duration-300 border-t-4 border-indigo-500">
              <CardMedia
                component="img"
                height="240"
                image={
                  product.images?.[0]?.url ||
                  product.imageUrl ||
                  "https://via.placeholder.com/400"
                }
                alt={product.name}
                className="object-cover h-60"
              />
              <Box className="p-4 space-y-3">
                <Typography
                  variant="h6"
                  className="font-sans font-medium tracking-wide text-slate-800"
                >
                  {product.name}
                </Typography>
                <Typography
                  variant="body2"
                  className="text-slate-600 line-clamp-2"
                >
                  {product.description?.substring(0, 100) ||
                    "No description available"}
                  {product.description?.length > 100 ? "..." : ""}
                </Typography>
                <Typography
                  variant="h6"
                  className="text-indigo-600 font-medium"
                >
                  ₱{Number(product.price).toFixed(2)}
                </Typography>
                <Box className="flex justify-between pt-2">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onOpenReviews(product)}
                    className="rounded-none text-indigo-600 border-indigo-600 hover:border-indigo-700 hover:bg-indigo-50 normal-case"
                  >
                    Reviews ({(reviews[product._id] || []).length})
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => onAddToCart(product, 1)}
                    className="rounded-none bg-indigo-600 hover:bg-indigo-700 normal-case"
                  >
                    Add to Cart
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }
);

// Main ProductDisplay Component
const ProductDisplay = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Management
  const [state, setState] = useState({
    products: [],
    loading: false,
    error: null,
    page: 0,
    rowsPerPage: 10,
    totalProducts: 0,
    totalPages: 0,
    searchTerm: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    filters: {
      minPrice: "",
      maxPrice: "",
      category: "",
      inStock: null,
    },
    reviews: {},
    loadingReviews: {},
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Update state utility function
  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Fetch Products with improved pagination
 const fetchProducts = useCallback(async (params = {}) => {
  try {
    updateState({ loading: true });
    
    const queryParams = {
      page: (params.page ?? state.page) + 1,
      limit: params.limit || state.rowsPerPage,
      sort: params.sort || state.sortBy,
      order: params.order || state.sortOrder,
      search: state.searchTerm,
      ...state.filters
    };

    console.log('Fetching with params:', queryParams);
    
    const response = await productApi.getAllProducts(queryParams);

    if (response?.data?.success) {
      updateState({
        products: response.data.data || [],
        totalProducts: response.data.total || 0,
        totalPages: response.data.pages || 1,
        page: params.page ?? state.page,
        loading: false,
        error: null
      });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    updateState({
      error: error.message,
      loading: false
    });
  }
}, [state.page, state.rowsPerPage, state.sortBy, state.sortOrder, state.searchTerm, state.filters]);

  // Fetch Reviews
  const fetchReviews = useCallback(async (productId) => {
    try {
      setState((prev) => ({
        ...prev,
        loadingReviews: { ...prev.loadingReviews, [productId]: true },
      }));

      const response = await productApi.getProductReviews(productId);

      setState((prev) => ({
        ...prev,
        reviews: {
          ...prev.reviews,
          [productId]: response,
        },
        loadingReviews: {
          ...prev.loadingReviews,
          [productId]: false,
        },
      }));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setState((prev) => ({
        ...prev,
        loadingReviews: {
          ...prev.loadingReviews,
          [productId]: false,
        },
      }));
    }
  }, []);

  // Debounced Search
  const debouncedSearch = useCallback(
    debounce((term) => {
      updateState({ searchTerm: term, page: 0 });
      fetchProducts({ page: 0 });
    }, 500),
    [fetchProducts]
  );

  // Initial Fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Pagination Handlers with Fix
  const handleChangePage = (event, newPage) => {
    console.log("Changing to page:", newPage);
    updateState({ page: newPage });
    fetchProducts({ page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log("Changing rows per page to:", newRowsPerPage);
    updateState({
      rowsPerPage: newRowsPerPage,
      page: 0, // Reset to first page when changing items per page
    });
    fetchProducts({
      page: 0,
      limit: newRowsPerPage,
    });
  };

  // Other Handlers
  const handleSort = (event) => {
    const newSortBy = event.target.value;
    console.log('Sorting by:', newSortBy);
    
    updateState({
      sortBy: newSortBy,
      page: 0
    });
  
    fetchProducts({
      page: 0,
      sort: newSortBy,
      order: state.sortOrder
    });
  };

  const handleOpenReviews = useCallback(
    async (product) => {
      setSelectedProduct(product);
      setReviewModalOpen(true);
      await fetchReviews(product._id);
    },
    [fetchReviews]
  );

  const handleCloseReviews = () => {
    setReviewModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = async (product, quantity) => {
    try {
      if (!product?._id) {
        throw new Error("Invalid product ID");
      }

      const response = await cartApi.addToCart(product._id, quantity);

      if (response.success) {
        toast.success(`Added ${quantity} ${product.name} to cart`);
        window.dispatchEvent(new CustomEvent("cart-updated"));
      } else {
        throw new Error(response.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error.message || "Failed to add item to cart");
    }
  };

  const handleEditReview = (review) => {
    setEditReview(review);
    setEditModalOpen(true);
  };

  const handleUpdateReview = (updatedReview) => {
    setState((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        [updatedReview.productId]: prev.reviews[updatedReview.productId].map(
          (r) => (r._id === updatedReview._id ? updatedReview : r)
        ),
      },
    }));
  };

  // Error State
  if (state.error && state.products.length === 0) {
    return (
      <Container>
        <Alert
          severity="error"
          className="mt-6 rounded-none border-l-4 border-red-500"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => fetchProducts()}
              className="text-red-700 hover:text-red-800"
            >
              Retry
            </Button>
          }
        >
          {state.error}
        </Alert>
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="pt-20 pb-12">
          <Container maxWidth="lg">
            {/* Header */}
            <Box className="mb-8">
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Typography
                    variant="h4"
                    component="h1"
                    className="font-sans font-medium tracking-tight text-slate-800"
                  >
                    Products{" "}
                    {!state.loading && state.totalProducts > 0 && (
                      <span className="text-indigo-600">
                        ({state.totalProducts})
                      </span>
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Box className="flex gap-4">
                    <TextField
                      fullWidth
                      placeholder="Search products..."
                      onChange={(e) => debouncedSearch(e.target.value)}
                      variant="outlined"
                      className="bg-white"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "0",
                          "&:hover fieldset": {
                            borderColor: "#6366f1",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#6366f1",
                            borderWidth: "2px",
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <SearchIcon className="text-slate-400" />
                        ),
                      }}
                    />
                    <FormControl
                      sx={{
                        minWidth: 120,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "0",
                          backgroundColor: "white",
                        },
                      }}
                    >
                      <InputLabel className="text-slate-600">
                        Sort By
                      </InputLabel>
                      <Select
  value={state.sortBy}
  onChange={handleSort}
  label="Sort By"
>
  <MenuItem value="createdAt">Newest First</MenuItem>
  <MenuItem value="-createdAt">Oldest First</MenuItem>
  <MenuItem value="price">Price: Low to High</MenuItem>
  <MenuItem value="-price">Price: High to Low</MenuItem>
  <MenuItem value="name">Name: A to Z</MenuItem>
  <MenuItem value="-name">Name: Z to A</MenuItem>
</Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Product Grid */}
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid
                products={state.products}
                onAddToCart={handleAddToCart}
                reviews={state.reviews}
                loadingReviews={state.loadingReviews}
                onOpenReviews={handleOpenReviews}
              />
            </Suspense>

            {/* Loading State */}
            {state.loading && <LoadingSpinner />}

            {/* Empty State */}
            {!state.loading && state.products.length === 0 && <EmptyState />}

            {/* Pagination */}
            {state.products.length > 0 && (
              <Box className="py-6 flex justify-end">
                <TablePagination
                  component="div"
                  count={state.totalProducts}
                  page={state.page}
                  onPageChange={handleChangePage}
                  rowsPerPage={state.rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  className="bg-white shadow-sm border-t-4 border-indigo-500"
                  sx={{
                    ".MuiTablePagination-select": {
                      borderRadius: "0",
                    },
                    ".MuiTablePagination-selectIcon": {
                      color: "#6366f1",
                    },
                  }}
                />
              </Box>
            )}

            {/* Modals */}
            <ReviewModal
              open={reviewModalOpen}
              onClose={handleCloseReviews}
              product={selectedProduct}
              reviews={
                selectedProduct ? state.reviews[selectedProduct._id] || [] : []
              }
              loading={
                selectedProduct
                  ? !!state.loadingReviews[selectedProduct._id]
                  : false
              }
              onEditReview={handleEditReview}
            />

            {editReview && (
              <EditReviewDialog
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                review={editReview}
                onUpdate={handleUpdateReview}
              />
            )}
          </Container>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default memo(ProductDisplay);
