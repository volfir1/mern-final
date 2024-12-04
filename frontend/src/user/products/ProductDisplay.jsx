// src/user/products/ProductDisplay.jsx

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
  Avatar, // Added Avatar
} from "@mui/material";
import {
  Close as CloseIcon,
  Star as StarIcon,
  Edit as EditIcon, // Added EditIcon
  MoreVert as MoreVertIcon, // Added MoreVertIcon if needed
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { format } from "date-fns"; // Added format
import { productApi } from "@/api/productApi"; // Ensure this path is correct
import { cartApi } from "@/api/cartApi"; // Ensure this path is correct
import { useReviewApi } from "@/api/reviewApi"; // Added useReviewApi
import { useAuth } from "@/utils/authContext"; // Ensure the correct import path
import Navbar from "@/components/navbar/Navbar"; // Ensure this path is correct
import ErrorBoundary from "@/utils/errorBoundary"; // Ensure this path is correct



// **ReviewStars Component**
const ReviewStars = memo(({ rating }) => (
  <Box display="flex" alignItems="center">
    <Rating
      value={rating}
      readOnly
      precision={0.5}
      size="small"
      emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
    />
  </Box>
));

// **ReviewCard Component**
const ReviewCard = memo(({ review, onEdit }) => (
  <Box
    sx={{
      mb: 3,
      p: 2,
      bgcolor: "background.paper",
      borderRadius: 1,
      boxShadow: 1,
    }}
  >
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="start"
      mb={1}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar
          src={review.user?.photoURL}
          alt={review.user?.displayName}
          sx={{ width: 32, height: 32 }}
        >
          {review.user?.displayName?.charAt(0) || "U"}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {review.user?.displayName || "Anonymous"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Order #{review.order?.orderNumber} •{" "}
            {format(new Date(review.createdAt), "MMM dd, yyyy")}
          </Typography>
        </Box>
      </Box>
      {review.user?._id === review.order?.userId && ( // Ensure `review.order.userId` correctly references the order owner
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => onEdit(review)}
        >
          Edit
        </Button>
      )}
    </Box>
    <ReviewStars rating={review.rating} />
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      {review.comment}
    </Typography>
  </Box>
));

// **ReviewModal Component with Edit Functionality**
const ReviewModal = memo(({ open, onClose, product, reviews = [], loading = false, onEditReview }) => {
  console.log('ReviewModal render with:', {
    open,
    product,
    reviewsLength: reviews?.length,
    reviews,
    loading
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md" 
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        Reviews for {product?.name}
        <IconButton 
          aria-label="close" 
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : reviews && reviews.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reviews.map((review) => (
              <ReviewCard 
                key={review._id} 
                review={review}
                onEdit={onEditReview}
              />
            ))}
          </Box>
        ) : (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">
              {loading ? 'Loading reviews...' : 'No reviews yet'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
});
// **EditReviewDialog Component**
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
        onUpdate(response.data); // Assuming response.data contains the updated review
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Your Review</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Rating
            name="rating"
            value={editedReview.rating}
            onChange={(_, newValue) => {
              setEditedReview((prev) => ({ ...prev, rating: newValue }));
            }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Review"
            value={editedReview.comment}
            onChange={(e) => {
              setEditedReview((prev) => ({ ...prev, comment: e.target.value }));
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// **ProductGridSkeleton Component (Skeleton Loading State)**
const ProductGridSkeleton = memo(() => (
  <Grid container spacing={3}>
    {[...Array(6)].map((_, index) => (
      <Grid item key={index} xs={12} sm={6} md={4}>
        <Card>
          <Skeleton variant="rectangular" height={200} />
          <Box sx={{ p: 2 }}>
            <Skeleton width="60%" />
            <Skeleton width="40%" />
            <Skeleton width="20%" />
          </Box>
        </Card>
      </Grid>
    ))}
  </Grid>
));

// **LoadingSpinner Component**
const LoadingSpinner = memo(() => (
  <Box display="flex" justifyContent="center" py={4}>
    <CircularProgress size={40} />
  </Box>
));

// **EmptyState Component**
const EmptyState = memo(() => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="60vh"
  >
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No products found
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Try adjusting your search or filters
    </Typography>
  </Box>
));

// **ProductGrid Component**
const ProductGrid = memo(
  ({ products, onAddToCart, reviews, loadingReviews, onOpenReviews }) => {
    console.log("ProductGrid received products:", products); // Debug log

    if (!products || products.length === 0) {
      return <EmptyState />;
    }

    return (
      <Grid container spacing={3}>
        {products.map((product) => {
          console.log("Rendering product:", product); // Debug log
          return (
            <Grid item key={product._id} xs={12} sm={6} md={4}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={
                    product.images?.[0]?.url ||
                    product.imageUrl ||
                    "https://via.placeholder.com/200"
                  }
                  alt={product.name}
                />
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.description?.substring(0, 100) ||
                      "No description available"}
                    {product.description?.length > 100 ? "..." : ""}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="text.primary"
                    sx={{ mt: 1 }}
                  >
                    ₱{Number(product.price).toFixed(2)}
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    sx={{ mt: 2 }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onOpenReviews(product)}
                    >
                      View Reviews ({(reviews[product._id] || []).length})
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onAddToCart(product, 1)}
                    >
                      Add to Cart
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  }
);

// **ProductDisplay Component**
const ProductDisplay = () => {


  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
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

  // **New State Variables**
  const [selectedProduct, setSelectedProduct] = useState(null); // State for selected product
  const [reviewModalOpen, setReviewModalOpen] = useState(false); // State for Reviews Modal
  const [editReview, setEditReview] = useState(null); // State for editing reviews
  const [editModalOpen, setEditModalOpen] = useState(false); // State for Edit Review Modal

  // Update state with functional updates to avoid stale closures
  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // **Fetch Products**
  const fetchProducts = useCallback(
    async (params = {}) => {
      try {
        console.log("Fetching products with params:", params);
        updateState({ loading: true, error: null });

        const queryParams = {
          page: params.page !== undefined ? params.page + 1 : state.page + 1, // Assuming backend uses 1-based page indexing
          limit: params.limit || state.rowsPerPage,
          sort: state.sortBy,
          order: state.sortOrder,
          search: state.searchTerm,
          ...state.filters,
          ...params,
        };

        console.log("Query Parameters:", queryParams);

        const response = await productApi.getAllProducts(queryParams);
        console.log("Raw API response:", response); // Debug log

        // Check for response structure
        if (!response || !response.data) {
          throw new Error("Invalid API response structure");
        }

        const { data, total, pages } = response.data;

        if (!Array.isArray(data)) {
          console.error("API returned invalid data format:", data);
          throw new Error("Invalid data format received");
        }

        updateState({
          products: data,
          totalProducts: total || data.length,
          totalPages: pages || Math.ceil(data.length / state.rowsPerPage),
          page: params.page !== undefined ? params.page : state.page,
          error: null,
        });

        console.log(`Successfully loaded ${data.length} products`);

        // Optionally, fetch reviews when products are fetched
        // Uncomment the following line if you want to fetch reviews on initial load
        // data.forEach((product) => fetchReviews(product._id));
      } catch (err) {
        console.error("Fetch Products Error:", err);
        updateState({
          error: err.message || "Failed to load products",
          products: [],
          totalProducts: 0,
          totalPages: 1,
        });
      } finally {
        updateState({ loading: false });
      }
    },
    [
      state.rowsPerPage,
      state.sortBy,
      state.sortOrder,
      state.searchTerm,
      state.filters,
    ]
  );

  // **Fetch Reviews for a Specific Product**
  const fetchReviews = useCallback(async (productId) => {
    try {
      console.log('Starting fetchReviews for:', productId);
      
      // Update loading state
      setState(prev => {
        console.log('Setting loading state:', { 
          ...prev.loadingReviews, 
          [productId]: true 
        });
        return {
          ...prev,
          loadingReviews: { 
            ...prev.loadingReviews, 
            [productId]: true 
          }
        };
      });
  
      // Fetch the reviews
      const response = await productApi.getProductReviews(productId);
      console.log('API Response for reviews:', response);
  
      // Update reviews in state
      setState(prev => {
        const updatedState = {
          ...prev,
          reviews: {
            ...prev.reviews,
            [productId]: response // Store the raw response
          },
          loadingReviews: {
            ...prev.loadingReviews,
            [productId]: false
          }
        };
        console.log('Updated state after fetching reviews:', updatedState);
        return updatedState;
      });
  
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setState(prev => ({
        ...prev,
        loadingReviews: {
          ...prev.loadingReviews,
          [productId]: false
        }
      }));
    }
  }, []);
  const handleViewReviews = useCallback(async (product) => {
    setSelectedProduct(product);
    setReviewModalOpen(true);
    await fetchReviews(product._id);
  }, [fetchReviews]);

  // **Debounced Search to Limit API Calls**
  const debouncedSearch = useCallback(
    debounce((term) => {
      console.log("Debounced Search Term:", term);
      updateState({ searchTerm: term, page: 0 });
      fetchProducts({ page: 0 });
    }, 500),
    [fetchProducts]
  );

  // **Initial Fetch on Component Mount**
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // **Handle Page Change for Pagination**
  const handleChangePage = (_, newPage) => {
    console.log("Changing to page:", newPage);
    fetchProducts({ page: newPage });
  };

  // **Handle Rows Per Page Change**
  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log("Changing rows per page to:", newRowsPerPage);
    updateState({ rowsPerPage: newRowsPerPage, page: 0 });
    fetchProducts({ page: 0, limit: newRowsPerPage });
  };

  // **Handle Sorting**
  const handleSort = (event) => {
    const newSortBy = event.target.value;
    console.log("Sorting by:", newSortBy);
    updateState({
      sortBy: newSortBy,
      page: 0,
    });
    fetchProducts({ page: 0 });
  };

  // **Handle Opening Reviews Modal**
  const handleOpenReviews = useCallback(async (product) => {
    console.log('handleOpenReviews called with product:', product);
    
    // First set the selected product and open modal
    setSelectedProduct(product);
    setReviewModalOpen(true);
    
    // Then fetch reviews
    await fetchReviews(product._id);
    
    // Log the current state after fetching
    console.log('Current state after fetching reviews:', state);
  }, [fetchReviews, state]);

  // **Handle Closing Reviews Modal**
  const handleCloseReviews = () => {
    console.log("Closing reviews modal");
    setReviewModalOpen(false);
    setSelectedProduct(null); // Reset selected product
  };

  // **Handle Adding a Product to the Cart**
  const handleAddToCart = async (product, quantity) => {
    try {
      if (!product?._id) {
        throw new Error("Invalid product ID");
      }

      console.log(
        `Adding product ID ${product._id} to cart with quantity ${quantity}`
      );
      const response = await cartApi.addToCart(product._id, quantity);
      console.log("Add to cart response:", response);

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

  // **Handle Editing a Review**
  const handleEditReview = (review) => {
    console.log("Editing review:", review);
    setEditReview(review);
    setEditModalOpen(true);
  };

  // **Handle Updating the Review in State after Editing**
  const handleUpdateReview = (updatedReview) => {
    console.log("Updated review:", updatedReview);
    setState((prev) => ({
      reviews: {
        ...prev.reviews,
        [updatedReview.productId]: prev.reviews[updatedReview.productId].map(
          (r) => (r._id === updatedReview._id ? updatedReview : r)
        ),
      },
    }));
  };

  // **Display Error if No Products are Fetched**
  if (state.error && state.products.length === 0) {
    return (
      <Container>
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => fetchProducts()}
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

  // **Compute Filtered and Paginated Products**
  const filteredProducts = state.products.filter(
    (product) =>
      product?.name?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      product?.sku?.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const paginatedProducts = filteredProducts.slice(
    state.page * state.rowsPerPage,
    state.page * state.rowsPerPage + state.rowsPerPage
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* **Header Section** */}
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Typography variant="h4" component="h1">
                    Products{" "}
                    {!state.loading &&
                      state.totalProducts > 0 &&
                      `(${state.totalProducts})`}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Box display="flex" gap={2}>
                    {/* **Search Field** */}
                    <TextField
                      fullWidth
                      placeholder="Search products..."
                      onChange={(e) => debouncedSearch(e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <StarIcon />, // Optional: Add an icon
                      }}
                    />
                    {/* **Sort By Dropdown** */}
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={state.sortBy}
                        onChange={handleSort}
                        label="Sort By"
                      >
                        <MenuItem value="createdAt">Newest</MenuItem>
                        <MenuItem value="price">Price</MenuItem>
                        <MenuItem value="name">Name</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* **Product Grid** */}
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid
                products={paginatedProducts}
                onAddToCart={handleAddToCart}
                reviews={state.reviews}
                loadingReviews={state.loadingReviews}
                onOpenReviews={handleOpenReviews}
              />
            </Suspense>

            {/* **Loading Spinner** */}
            {state.loading && <LoadingSpinner />}

            {/* **Empty State** */}
            {!state.loading && filteredProducts.length === 0 && <EmptyState />}

            {/* **Pagination** */}
            {filteredProducts.length > 0 && (
              <Box sx={{ py: 2, display: "flex", justifyContent: "flex-end" }}>
                <TablePagination
                  component="div"
                  count={state.totalProducts}
                  page={state.page}
                  onPageChange={handleChangePage}
                  rowsPerPage={state.rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Products per page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} of ${count}`
                  }
                />
              </Box>
            )}
          </Container>
        </div>
      </div>

      {/* **Reviews Modal** */}
      <ReviewModal
    open={reviewModalOpen}
    onClose={() => {
      console.log('Closing review modal');
      setReviewModalOpen(false);
      setSelectedProduct(null);
    }}
    product={selectedProduct}
    reviews={selectedProduct ? (state.reviews[selectedProduct._id] || []) : []}
    loading={selectedProduct ? !!state.loadingReviews[selectedProduct._id] : false}
    onEditReview={handleEditReview}
  />

      {/* **Edit Review Dialog** */}
      {editReview && (
        <EditReviewDialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          review={editReview}
          onUpdate={handleUpdateReview}
        />
      )}
    </ErrorBoundary>
  );
};

// **Export the component**
export default memo(ProductDisplay);
