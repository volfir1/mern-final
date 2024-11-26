import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Menu, MenuItem } from '@mui/material';

const SupplierActions = ({ supplier, onEdit, onDelete, disabled = false }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Handle menu open/close
  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Action handlers
  const handleEdit = (e) => {
    e.stopPropagation();
    handleClose();
    onEdit(supplier);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    handleClose();
    onDelete(supplier);
  };

  return (
    <div className="flex items-center space-x-1">
      {/* Desktop Actions */}
      <div className="hidden sm:flex space-x-1">
        <Tooltip 
          title="Edit supplier" 
          placement="top"
          arrow
        >
          <IconButton
            size="small"
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            disabled={disabled}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip 
          title="Delete supplier" 
          placement="top"
          arrow
        >
          <IconButton
            size="small"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            disabled={disabled}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      {/* Mobile Menu */}
      <div className="sm:hidden">
        <IconButton
          size="small"
          onClick={handleClick}
          disabled={disabled}
          className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleEdit} disabled={disabled}>
            <EditIcon fontSize="small" className="mr-2" /> Edit
          </MenuItem>
          <MenuItem 
            onClick={handleDelete} 
            disabled={disabled}
            className="text-red-600 hover:text-red-800"
          >
            <DeleteIcon fontSize="small" className="mr-2" /> Delete
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
};

SupplierActions.propTypes = {
  supplier: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
    phone: PropTypes.string,
    image: PropTypes.string,
    description: PropTypes.string,
    addressType: PropTypes.string,
    street: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    country: PropTypes.string,
    zipCode: PropTypes.string,
    active: PropTypes.bool,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default React.memo(SupplierActions);