// UserOrders.jsx

import React, { useState, useEffect } from 'react';
import {
  ArrowBack,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Schedule as PendingIcon,
  CheckCircle as DeliveredIcon,
  Cancel as CancelledIcon,
  Receipt as OrderIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import useOrderApi from '@/api/orderApi'; // Ensure this hook is correctly implemented

// **OrderStatusChip Component**
const OrderStatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <PendingIcon className="h-4 w-4" />;
      case 'PROCESSING':
        return <PaymentIcon className="h-4 w-4" />;
      case 'SHIPPED':
        return <ShippingIcon className="h-4 w-4" />;
      case 'DELIVERED':
        return <DeliveredIcon className="h-4 w-4" />;
      case 'CANCELLED':
        return <CancelledIcon className="h-4 w-4" />;
      default:
        return <OrderIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      <span className="mr-1">{getStatusIcon(status)}</span>
      {status}
    </div>
  );
};

// **OrderItem Component**
const OrderItem = ({ item }) => (
  <Box className="flex items-center gap-4 p-4 border-b last:border-b-0">
    <img
      src={item.product?.images?.[0] || '/api/placeholder/80/80'}
      alt={item.name}
      className="w-20 h-20 object-cover rounded-lg"
    />
    <Box className="flex-1">
      <Typography variant="subtitle1" className="font-medium">
        {item.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Quantity: {item.quantity}
      </Typography>
      <Typography variant="subtitle2" className="mt-1">
        ₱{item.price.toFixed(2)} × {item.quantity} = ₱{(item.price * item.quantity).toFixed(2)}
      </Typography>
    </Box>
  </Box>
);

// **Main UserOrders Component**
const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // **States for Order Cancellation**
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const orderApi = useOrderApi();

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // **Fetch Orders from Backend**
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getUserOrders(); // Assuming this fetches current user's orders
      if (response.success) {
        setOrders(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // **Handle Page Change for Pagination**
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // **Handle Rows Per Page Change for Pagination**
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // **Cancel Order Handler**
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      setCancelling(true);
      const response = await orderApi.cancelOrder(selectedOrder._id);

      if (response.success) {
        // Update order status locally
        setOrders(orders.map(order => 
          order._id === selectedOrder._id 
            ? { ...order, orderStatus: 'CANCELLED' }
            : order
        ));
        toast.success('Order cancelled successfully');
      } else {
        throw new Error(response.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  // **CancelOrderDialog Component**
  const CancelOrderDialog = () => (
    <Dialog 
      open={cancelDialogOpen} 
      onClose={() => !cancelling && setCancelDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Cancel Order
        {!cancelling && (
          <IconButton
            aria-label="close"
            onClick={() => setCancelDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to cancel order #{selectedOrder?.orderNumber}?
        </Typography>
        <Typography color="warning.main" variant="body2">
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setCancelDialogOpen(false)} 
          disabled={cancelling}
          color="inherit"
        >
          Keep Order
        </Button>
        <Button
          onClick={handleCancelOrder}
          color="error"
          variant="contained"
          disabled={cancelling}
          startIcon={cancelling ? <CircularProgress size={20} /> : <CancelledIcon />}
        >
          {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // **Handle Order Row Click to Expand/Collapse**
  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // **Loading State**
  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[400px]">
        <CircularProgress />
      </Box>
    );
  }

  // **Error State**
  if (error) {
    return (
      <Alert severity="error" className="m-4">
        {error}
      </Alert>
    );
  }

  // **No Orders Found**
  if (!orders.length) {
    return (
      <Paper className="p-8 text-center">
        <OrderIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <Typography variant="h6" color="text.secondary">
          No Orders Found
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-2">
          You haven't placed any orders yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box className="container mx-auto px-4 py-8">
      {/* **Header Section** */}
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" component="h1" className="font-bold">
          Your Orders
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/user/products')}
          startIcon={<ArrowBack />}
          className="hover:bg-gray-50"
        >
          Back to Products
        </Button>
      </Box>
  
      {/* **Orders Table** */}
      <TableContainer 
        component={Paper} 
        className="mb-4 shadow-md rounded-lg overflow-hidden"
      >
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell className="w-12" />
              <TableCell className="font-medium">Order Number</TableCell>
              <TableCell className="font-medium">Date</TableCell>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">Status</TableCell>
              <TableCell className="font-medium">Payment</TableCell>
              {/* Removed "Actions" Column to simplify */}
            </TableRow>
          </TableHead>
          <TableBody>
            {orders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order) => (
                <React.Fragment key={order._id}>
                  {/* **Order Row** */}
                  <TableRow 
                    hover 
                    className="transition-colors cursor-pointer"
                    onClick={() => toggleExpandOrder(order._id)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedOrder === order._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" className="font-medium text-gray-900">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      ₱{order.total.toFixed(2)}
                    </TableCell>
                    {/* **Status Column with Cancel Order Button** */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <OrderStatusChip status={order.orderStatus} />
                        {order.orderStatus === 'PENDING' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelledIcon />}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row expansion
                              setSelectedOrder(order);
                              setCancelDialogOpen(true);
                            }}
                            aria-label={`Cancel order ${order.orderNumber}`}
                          >
                            Cancel Order
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentStatus}
                        color={order.paymentStatus === 'PAID' ? 'success' : 
                               order.paymentStatus === 'FAILED' ? 'error' : 'warning'}
                        variant="outlined"
                        size="small"
                        className="font-medium"
                      />
                    </TableCell>
                  </TableRow>
  
                  {/* **Expanded Order Details** */}
                  <TableRow>
                    <TableCell className="p-0" colSpan={6}>
                      <Collapse in={expandedOrder === order._id} timeout="auto" unmountOnExit>
                        <Box className="p-6 bg-gray-50 space-y-6">
                          <Typography variant="h6" className="font-bold text-gray-900">
                            Order Details
                          </Typography>
                          <Paper variant="outlined" className="overflow-hidden">
                            {order.items.map((item) => (
                              <OrderItem key={item._id} item={item} />
                            ))}
                          </Paper>
                          <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* **Shipping Address Section** */}
                            <Box className="space-y-3">
                              <Typography variant="subtitle2" className="font-bold text-gray-900">
                                Shipping Address
                              </Typography>
                              <Paper variant="outlined" className="p-4 bg-white">
                                <Typography variant="body2" className="text-gray-700 leading-relaxed">
                                  {order.shippingAddress?.street}<br />
                                  {order.shippingAddress?.barangay}, {order.shippingAddress?.city}<br />
                                  {order.shippingAddress?.province}, {order.shippingAddress?.postalCode}
                                </Typography>
                              </Paper>
                            </Box>
                            {/* **Order Summary Section** */}
                            <Box className="space-y-3">
                              <Typography variant="subtitle2" className="font-bold text-gray-900">
                                Order Summary
                              </Typography>
                              <Paper variant="outlined" className="p-4 bg-white divide-y divide-gray-200">
                                <Box className="flex justify-between py-2">
                                  <Typography variant="body2" className="text-gray-600">Subtotal:</Typography>
                                  <Typography variant="body2" className="text-gray-900">₱{order.subtotal.toFixed(2)}</Typography>
                                </Box>
                                <Box className="flex justify-between py-2">
                                  <Typography variant="body2" className="text-gray-600">Shipping:</Typography>
                                  <Typography variant="body2" className="text-green-600 font-medium">Free</Typography>
                                </Box>
                                <Box className="flex justify-between pt-2">
                                  <Typography variant="subtitle2" className="font-bold text-gray-900">Total:</Typography>
                                  <Typography variant="subtitle2" className="font-bold text-gray-900">₱{order.total.toFixed(2)}</Typography>
                                </Box>
                              </Paper>
                            </Box>
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
  
      {/* **Pagination Controls** */}
      <TablePagination
        component={Paper}
        count={orders.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        className="shadow-sm"
      />
  
      {/* **Cancel Order Confirmation Dialog** */}
      <CancelOrderDialog />
    </Box>
  );
}; // Close UserOrders component

export default UserOrders; // Export component
