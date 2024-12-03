import React, { useState, useEffect } from 'react';
import { useOrderApi } from '@/api/orderApi';
import { format } from 'date-fns';
import {
  Box,
  Card,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit } from 'lucide-react';
import Sidebar from '@/components/sidebar/Sidebar';

export function OrderManagement() {
  const orderApi = useOrderApi();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getAllOrders();
      
      if (response.success && Array.isArray(response.data)) {
        const formattedOrders = response.data.map(order => ({
          id: order._id || order.id, // Handle both _id and id
          orderNumber: order.orderNumber || 'N/A',
          date: format(new Date(order.createdAt), 'MMM dd, yyyy'),
          customerEmail: order.user?.email || 'N/A',
          total: `₱${order.total?.toFixed(2) || '0.00'}`,
          orderStatus: order.orderStatus || 'PENDING',
          paymentMethod: order.paymentMethod || 'N/A',
          items: order.items?.length || 0
        }));
        setOrders(formattedOrders);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch orders: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      
      if (!selectedOrder?.id || !newStatus) {
        throw new Error('Missing required fields');
      }

      const response = await orderApi.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        statusNote
      );

      if (response.success) {
        await fetchOrders();
        handleCloseDialog();
        alert('Order status updated successfully');
      }
    } catch (err) {
      alert(`Failed to update order status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setUpdateDialog(false);
    setStatusNote('');
    setNewStatus('');
    setSelectedOrder(null);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusChip = (status) => {
    const statusConfig = {
      PENDING: { color: 'warning', label: 'Pending' },
      PROCESSING: { color: 'info', label: 'Processing' },
      SHIPPED: { color: 'primary', label: 'Shipped' },
      DELIVERED: { color: 'success', label: 'Delivered' },
      CANCELLED: { color: 'error', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const columns = [
    { 
      field: 'orderNumber', 
      headerName: 'Order ID', 
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" className="font-medium">
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'date', 
      headerName: 'Date',
      width: 130
    },
    {
      field: 'customerEmail',
      headerName: 'Customer Email',
      width: 220
    },
    {
      field: 'paymentMethod',
      headerName: 'Payment Method',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value === 'COD' ? 'Cash on Delivery' : params.value}
        </Typography>
      )
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 100,
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2" className="font-medium">
          {params.value}
        </Typography>
      )
    },
    {
      field: 'total',
      headerName: 'Total Amount',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" className="font-medium">
          {params.value}
        </Typography>
      )
    },
    {
      field: 'orderStatus',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => getStatusChip(params.value)
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
            setUpdateDialog(true);
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
      <Sidebar />
      <div className="flex-1 p-8 ml-20 overflow-auto">
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        <Card className="shadow-md">
          <Box className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h5" className="font-bold">
                Order Management
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
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
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              rowsPerPageOptions={[5, 10, 20, 50]}
              pagination
              autoHeight
              loading={loading}
              disableSelectionOnClick
              className="bg-white"
              components={{
                LoadingOverlay: () => (
                  <div className="flex justify-center items-center h-full">
                    <CircularProgress />
                  </div>
                )
              }}
            />
          </Box>
        </Card>

        <Dialog 
          open={updateDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle className="bg-gray-50 border-b">
            Update Order Status
          </DialogTitle>
          <DialogContent>
            <Box className="mt-4 space-y-4">
              <div>
                <Typography variant="subtitle2" className="mb-2">
                  Order Number: {selectedOrder?.orderNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Status: {selectedOrder?.orderStatus}
                </Typography>
              </div>
              <div>
                <Typography variant="subtitle2" className="mb-2">
                  New Status
                </Typography>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PROCESSING">Processing</MenuItem>
                  <MenuItem value="SHIPPED">Shipped</MenuItem>
                  <MenuItem value="DELIVERED">Delivered</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </div>
              <div>
                <Typography variant="subtitle2" className="mb-2">
                  Status Note
                </Typography>
                <TextField
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Add a note about this status update..."
                />
              </div>
            </Box>
          </DialogContent>
          <DialogActions className="bg-gray-50 border-t p-4">
            <Button 
              onClick={handleCloseDialog}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate} 
              variant="contained" 
              color="primary"
              disabled={loading || !newStatus || newStatus === selectedOrder?.orderStatus}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Status'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

export default OrderManagement;