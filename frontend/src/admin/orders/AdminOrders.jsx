import React, { useState, useEffect } from 'react';
import { useOrderApi } from '@/api/orderApi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';
import {
  Box, Card, Chip, IconButton, MenuItem, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert, FormControl, InputLabel, Select
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit } from '@mui/icons-material';
import Sidebar from '@/components/sidebar/Sidebar';

export function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [pageSize, setPageSize] = useState(10);
  
  const orderApi = useOrderApi();

  const statusConfig = {
    PENDING: { color: 'warning', label: 'Pending', paymentStatus: 'PENDING' },
    PROCESSING: { color: 'info', label: 'Processing', paymentStatus: 'PENDING' },
    SHIPPED: { color: 'primary', label: 'Shipped', paymentStatus: 'PENDING' },
    DELIVERED: { color: 'success', label: 'Delivered', paymentStatus: 'PAID' },
    CANCELLED: { color: 'error', label: 'Cancelled', paymentStatus: 'FAILED' }
  };

  const getStatusChip = (status) => {
    const { color, label } = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={label} color={color} size="small" />;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getAllOrders();
      
      if (!response?.data) throw new Error('No data received');

      const formattedOrders = response.data.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        date: format(new Date(order.createdAt), 'MMM dd, yyyy'),
        customerEmail: order.user?.email || 'N/A',
        total: `₱${Number(order.total).toFixed(2)}`,
        orderStatus: order.orderStatus,
        paymentStatus: statusConfig[order.orderStatus].paymentStatus,
        items: order.items.length,
        statusUpdates: order.statusUpdates || []
      }));

      setOrders(formattedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      if (!selectedOrder?.id || !newStatus) throw new Error('Missing required fields');
  
      // Send just the status string, not an object
      await orderApi.updateOrderStatus(selectedOrder.id, newStatus, statusNote);
      
      await fetchOrders();
      handleCloseDialog();
      toast.success('Order status updated successfully');
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Failed to update order status');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setStatusNote('');
    setNewStatus('');
    setSelectedOrder(null);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = [
    { 
      field: 'orderNumber',
      headerName: 'Order Number',
      width: 200
    },
    { field: 'date', headerName: 'Date', width: 130 },
    { field: 'customerEmail', headerName: 'Customer', width: 200 },
    {
      field: 'items',
      headerName: 'Items',
      width: 80,
      align: 'center'
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120
    },
    {
      field: 'orderStatus',
      headerName: 'Delivery Status',
      width: 150,
      renderCell: (params) => getStatusChip(params.value)
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment Status',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" className={`font-medium 
          ${params.value === 'PAID' ? 'text-green-600' : 
            params.value === 'FAILED' ? 'text-red-600' : 
            'text-yellow-600'}`}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton 
          onClick={() => {
            setSelectedOrder(params.row);
            setNewStatus(params.row.orderStatus);
            setDialogOpen(true);
          }}
          className="hover:bg-gray-100"
        >
          <Edit className="w-5 h-5" />
        </IconButton>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <Sidebar />
      
      <div className="flex-1 p-8 ml-20 overflow-auto">
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}
        
        <Card className="shadow-md">
          <Box className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h5" className="font-bold">
                Order Management
              </Typography>
              <Button 
                variant="outlined" 
                onClick={fetchOrders}
                disabled={loading}
              >
                Refresh Orders
              </Button>
            </div>
            
            <DataGrid
              rows={orders}
              columns={columns}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              rowsPerPageOptions={[5, 10, 20, 50]}
              autoHeight
              loading={loading}
              disableSelectionOnClick
              className="bg-white"
            />
          </Box>
        </Card>

        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle className="bg-gray-50 border-b">
            Update Delivery Status
          </DialogTitle>
          <DialogContent>
            <Box className="mt-4 space-y-4">
              <div className="space-y-2">
                <Typography variant="subtitle2">
                  Order: {selectedOrder?.orderNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Status: {selectedOrder?.orderStatus}
                </Typography>
              </div>

              <FormControl fullWidth>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="New Status"
                >
                  {Object.entries(statusConfig).map(([value, { label }]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <div className="p-3 bg-gray-50 rounded-md">
                <Typography variant="body2" className="text-gray-600">
                  Payment will be marked as:
                  <span className={`font-medium ml-1 
                    ${statusConfig[newStatus]?.paymentStatus === 'PAID' ? 'text-green-600' : 
                      statusConfig[newStatus]?.paymentStatus === 'FAILED' ? 'text-red-600' : 
                      'text-yellow-600'}`}>
                    {statusConfig[newStatus]?.paymentStatus}
                  </span>
                </Typography>
              </div>

              <TextField
                fullWidth
                label="Status Note"
                multiline
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a note about this status update..."
              />
            </Box>
          </DialogContent>
          <DialogActions className="bg-gray-50 border-t p-4">
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate}
              variant="contained" 
              color="primary"
              disabled={!newStatus || newStatus === selectedOrder?.orderStatus}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

export default OrderManagement;