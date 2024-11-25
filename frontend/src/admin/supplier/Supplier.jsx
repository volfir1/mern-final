// src/pages/admin/supplier/index.jsx
import React from 'react';
import { Box, Container, Breadcrumbs, Link, Typography } from '@mui/material';
import { Home as HomeIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { SupplierList } from './components';
import Sidebar from '@/components/sidebar/Sidebar';

const Supplier = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <Box className="bg-white border-b">
          <Container maxWidth="2xl" className="py-4">
            <Breadcrumbs
              separator={<ChevronRightIcon fontSize="small" />}
              aria-label="breadcrumb"
            >
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <HomeIcon fontSize="small" className="mr-1" />
                Dashboard
              </Link>
              <Link
                href="/products"
                className="text-gray-600 hover:text-gray-900"
              >
                Products
              </Link>
              <Typography color="text.primary">Suppliers</Typography>
            </Breadcrumbs>
          </Container>
        </Box>

        {/* Main Content */}
        <Box className="p-8 overflow-y-auto h-[calc(100vh-64px)]">
          <Container maxWidth="2xl">
            <SupplierList />
          </Container>
        </Box>
      </div>
    </div>
  );
};

export default Supplier;