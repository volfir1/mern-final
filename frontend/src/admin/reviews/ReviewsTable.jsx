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
import leoProfanity from "leo-profanity"; // Import the leo-profanity package

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
            photoURL: review.user?.photoURL,
          },
          product: {
            name: review.product?.name,
            title: review.product?.title,
          },
          rating: Number(review.rating) || 0,
          comment: leoProfanity.clean(review.comment || ''),  // Clean the comment for profanity
          createdAt: review.createdAt,
          order: review.order,
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
    <Box className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <Box
        className="flex-1 p-6 transition-all duration-300"
        sx={{
          marginLeft: '80px', // Default sidebar width (w-20)
          '@media (min-width: 1024px)': {
            marginLeft: '80px', // Keep margin consistent
          }
        }}
      >
        <Typography variant="h5" className="font-medium text-neutral-800 mb-6">
          Review Management
        </Typography>

        <Box
          className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden"
          sx={{
            height: 'calc(100vh - 180px)', // Adjust height accounting for header and padding
            width: 'calc(100vw - 120px)', // Adjust width accounting for sidebar and padding
          }}
        >
          <DataGrid
            rows={reviews || []}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: "createdAt", sort: "desc" }] },
            }}
            className="border-none"
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-main': {
                padding: '1rem',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                padding: '1rem',
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                minHeight: '3.5rem !important',
              },
              '& .MuiDataGrid-columnHeader': {
                padding: '0 1rem',
              },
              '& .MuiDataGrid-row': {
                minHeight: '4rem !important',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f9fafb',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
              },
              '& .MuiTablePagination-root': {
                padding: '1rem',
              }
            }}
            components={{
              NoRowsOverlay: () => (
                <Box className="flex h-[400px] items-center justify-center text-neutral-500">
                  <Typography>No reviews found</Typography>
                </Box>
              ),
              LoadingOverlay: () => (
                <Box className="flex h-full items-center justify-center">
                  <CircularProgress />
                </Box>
              ),
            }}
          />
        </Box>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Review</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Are you sure you want to delete the review from{" "}
              <strong>{selectedReview?.user?.email || 'Unknown user'}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              disabled={deleting}
            >
              {deleting ? (
                <CircularProgress size={20} />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ReviewsTable;
