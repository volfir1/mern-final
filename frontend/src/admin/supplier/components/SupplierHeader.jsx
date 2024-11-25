// src/admin/supplier/components/SupplierHeader.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Divider,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  BarChart as StatsIcon
} from '@mui/icons-material';
import debounce from 'lodash/debounce';

const SupplierHeader = ({
  onAdd,
  searchQuery = '',
  handleSearchChange,
  totalItems = 0,
  activeFilters = {},
  onFilterChange,
  onRefresh,
  onExport,
  loading = false,
  stats = { active: 0, inactive: 0, total: 0 }
}) => {
  // Filter menu state
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState(searchQuery);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      handleSearchChange(value);
    }, 300),
    [handleSearchChange]
  );

  // Search handlers
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchValue('');
    handleSearchChange('');
  };

  // Filter handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filter) => {
    onFilterChange(filter);
    handleFilterClose();
  };

  const clearFilters = () => {
    onFilterChange(null);
    handleFilterClose();
  };

  return (
    <Box className="space-y-4">
      {/* Title and Stats Row */}
      <Box className="flex justify-between items-center">
        <div>
          <Typography variant="h5" className="font-medium">
            Suppliers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your supplier information and relationships
          </Typography>
        </div>
        <div className="flex gap-3">
          <Tooltip title="Active suppliers" arrow>
            <Chip
              icon={<ActiveIcon className="text-green-500" />}
              label={`${stats.active} Active`}
              color="success"
              variant="outlined"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Inactive suppliers" arrow>
            <Chip
              icon={<InactiveIcon className="text-gray-500" />}
              label={`${stats.inactive} Inactive`}
              color="default"
              variant="outlined"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Total suppliers" arrow>
            <Chip
              icon={<StatsIcon className="text-blue-500" />}
              label={`${stats.total} Total`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Tooltip>
        </div>
      </Box>

      {/* Actions Row */}
      <Box className="flex items-center justify-between gap-4">
        {/* Search Field */}
        <div className="flex-1 max-w-md">
          <TextField
            fullWidth
            size="small"
            placeholder="Search suppliers..."
            value={searchValue}
            onChange={handleSearchInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-gray-400" />
                </InputAdornment>
              ),
              endAdornment: searchValue && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={clearSearch}
                    edge="end"
                    aria-label="clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Tooltip title="Filter list" arrow>
            <span>
              <IconButton
                onClick={handleFilterClick}
                disabled={loading}
                size="small"
                className="text-gray-600 hover:text-gray-900"
              >
                <Badge
                  badgeContent={Object.keys(activeFilters).length}
                  color="primary"
                >
                  <FilterIcon />
                </Badge>
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Refresh list" arrow>
            <span>
              <IconButton
                onClick={onRefresh}
                disabled={loading}
                size="small"
                className="text-gray-600 hover:text-gray-900"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Export suppliers" arrow>
            <span>
              <IconButton
                onClick={onExport}
                disabled={loading}
                size="small"
                className="text-gray-600 hover:text-gray-900"
              >
                <ExportIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            disabled={loading}
            className="ml-2"
          >
            Add Supplier
          </Button>
        </div>
      </Box>

      {/* Active Filters */}
      {Object.keys(activeFilters).length > 0 && (
        <Box className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => (
            <Chip
              key={key}
              label={`${key}: ${value}`}
              onDelete={() => onFilterChange(key, null)}
              size="small"
              variant="outlined"
            />
          ))}
          <Chip
            label="Clear all filters"
            onClick={clearFilters}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleFilterSelect('status:active')}>
          <ListItemIcon>
            <ActiveIcon fontSize="small" className="text-green-500" />
          </ListItemIcon>
          <ListItemText>Active Only</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleFilterSelect('status:inactive')}>
          <ListItemIcon>
            <InactiveIcon fontSize="small" className="text-gray-500" />
          </ListItemIcon>
          <ListItemText>Inactive Only</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={clearFilters}>
          <ListItemIcon>
            <ClearIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clear Filters</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

SupplierHeader.propTypes = {
  onAdd: PropTypes.func.isRequired,
  searchQuery: PropTypes.string,
  handleSearchChange: PropTypes.func.isRequired,
  totalItems: PropTypes.number,
  activeFilters: PropTypes.object,
  onFilterChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  stats: PropTypes.shape({
    active: PropTypes.number,
    inactive: PropTypes.number,
    total: PropTypes.number
  })
};

export default React.memo(SupplierHeader);