import React, { useState, useEffect } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useReviewApi } from "@/api/reviewApi";
import Sidebar from "@/components/sidebar/Sidebar"; // Ensure this is the correct path for your Sidebar component

const ReviewsTable = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const reviewApi = useReviewApi();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewApi.getAllReviews();

      if (response?.success && Array.isArray(response?.data)) {
        const reviewsData = response.data.map(review => ({
          id: review._id,
          _id: review._id,
          user: {
            email: review.user?.email,
            displayName: review.user?.displayName,
            photoURL: review.user?.photoURL
          },
          product: {
            name: review.product?.name,
            title: review.product?.title
          },
          rating: Number(review.rating) || 0,
          comment: review.comment || '',
          createdAt: review.createdAt,
          order: review.order
        }));

        setReviews(reviewsData);
      } else {
        setError('Unable to load reviews');
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteClick = (review) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await reviewApi.deleteReview(selectedReview._id);

      setReviews((prevReviews) =>
        prevReviews.filter((review) => review._id !== selectedReview._id)
      );

      toast.success("Review deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to delete review");
    } finally {
      setDeleting(false);
      setSelectedReview(null);
    }
  };

  const columns = [
    {
      field: "user",
      headerName: "User",
      width: 300,  // Increased the width
      renderCell: (params) => {
        const user = params.row.user || {};
        return (
          <Box className="flex items-center gap-2">
            <Avatar src={user.photoURL || ''} className="w-10 h-10 bg-indigo-100">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || "?"}
            </Avatar>
            <Box>
              <Typography variant="body2" className="font-medium">
                {user.displayName || user.email || "Anonymous"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email || 'No email'}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "product",
      headerName: "Product",
      width: 250,  // Increased the width
      renderCell: (params) => {
        const product = params.row.product || {};
        return product.name || product.title || 'No product';
      }
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 180,  // Increased the width
      renderCell: (params) => (
        <Rating value={params.row.rating || 0} readOnly size="small" />
      )
    },
    {
      field: "comment",
      headerName: "Comment",
      flex: 2,  // Made the comment column larger
      minWidth: 300,
      renderCell: (params) => params.row.comment || "No comment provided"
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 180,  // Increased the width
      renderCell: (params) => {
        if (!params.row.createdAt) return "No date";
        try {
          return format(new Date(params.row.createdAt), "MMM dd, yyyy");
        } catch {
          return "Invalid date";
        }
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,  // Increased the width
      type: "actions",
      getActions: (params) => [
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteClick(params.row)}
          color="error"
        />
      ]
    }
  ];

  if (error) {
    return (
      <Alert severity="error" className="m-4">
        {error}
      </Alert>
    );
  }

  return (
    <Box
      className="flex w-85 min-h-screen bg-gray-100"
      sx={{
        display: "flex",
        flexDirection: "row",
      }}
    >
      {/* Sidebar Section */}
      <Sidebar />  {/* Re-imported and used the Sidebar component here */}

      {/* Main Content Section (Table) */}
      <Box
        className="flex-1 p-4"
        sx={{
          backgroundColor: "#fff",
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingTop: "20px",
        }}
      >
        <Box className="h-[800px] w-full bg-white rounded-lg shadow-sm"> {/* Increased height */}
        <DataGrid
  rows={reviews || []}
  columns={columns}
  getRowId={(row) => row.id}
  loading={loading}
  pageSizeOptions={[10, 25, 50]}
  initialState={{
    pagination: {
      paginationModel: { pageSize: 10 },
    },
    sorting: {
      sortModel: [{ field: "createdAt", sort: "desc" }],
    },
  }}
  className="border-none"
  disableRowSelectionOnClick
  sx={{
    width: '90%',  // Set width of the DataGrid to be 90% of the available space (or adjust as needed)
    margin: '0 auto',  // Centers the table horizontally
    "& .MuiDataGrid-cell": {
      borderBottom: "1px solid #f0f0f0",
    },
  }}
  components={{
    NoRowsOverlay: () => (
      <Box
        sx={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>No reviews found</Typography>
      </Box>
    ),
  }}
/>

        </Box>
      </Box>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="bg-slate-50 border-b">
          Delete Review
        </DialogTitle>
        <DialogContent className="mt-4">
          <Typography>
            Are you sure you want to delete this review? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions className="bg-slate-50 border-t p-4">
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            className="text-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            color="error"
            variant="contained"
            className="bg-red-500 hover:bg-red-600"
          >
            {deleting ? (
              <CircularProgress size={20} className="text-white" />
            ) : (
              "Delete Review"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewsTable;
