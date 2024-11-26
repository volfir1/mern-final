import React, { useState, useEffect } from 'react';
import {
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
  TablePagination
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Schedule as PendingIcon,
  CheckCircle as DeliveredIcon,
  Cancel as CancelledIcon,
  Receipt as OrderIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '@/utils/api';

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

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/checkout/orders');
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[400px]">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="m-4">
        {error}
      </Alert>
    );
  }

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
      <Typography variant="h4" component="h1" className="mb-6 font-bold">
        Your Orders
      </Typography>

      <TableContainer component={Paper} className="mb-4">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Order Number</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order) => (
                <React.Fragment key={order._id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                      >
                        {expandedOrder === order._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" className="font-medium">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>₱{order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <OrderStatusChip status={order.orderStatus} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentStatus}
                        color={order.paymentStatus === 'PAID' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="p-0" colSpan={6}>
                      <Collapse in={expandedOrder === order._id} timeout="auto" unmountOnExit>
                        <Box className="p-4 bg-gray-50">
                          <Typography variant="h6" className="mb-3">
                            Order Details
                          </Typography>
                          <Paper variant="outlined" className="mb-4">
                            {order.items.map((item) => (
                              <OrderItem key={item._id} item={item} />
                            ))}
                          </Paper>
                          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Box>
                              <Typography variant="subtitle2" className="mb-2 font-medium">
                                Shipping Address
                              </Typography>
                              <Paper variant="outlined" className="p-3">
                                <Typography variant="body2">
                                  {order.shippingAddress?.street}
                                  <br />
                                  {order.shippingAddress?.barangay}, {order.shippingAddress?.city}
                                  <br />
                                  {order.shippingAddress?.province}, {order.shippingAddress?.postalCode}
                                </Typography>
                              </Paper>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" className="mb-2 font-medium">
                                Order Summary
                              </Typography>
                              <Paper variant="outlined" className="p-3">
                                <Box className="flex justify-between mb-2">
                                  <Typography variant="body2">Subtotal:</Typography>
                                  <Typography variant="body2">₱{order.subtotal.toFixed(2)}</Typography>
                                </Box>
                                <Box className="flex justify-between mb-2">
                                  <Typography variant="body2">Shipping:</Typography>
                                  <Typography variant="body2" className="text-green-600">Free</Typography>
                                </Box>
                                <Box className="flex justify-between font-medium">
                                  <Typography variant="subtitle2">Total:</Typography>
                                  <Typography variant="subtitle2">₱{order.total.toFixed(2)}</Typography>
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

      <TablePagination
        component="div"
        count={orders.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Box>
  );
};

export default UserOrders;