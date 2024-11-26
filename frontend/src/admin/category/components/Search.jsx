import React, { memo } from 'react';
import { TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const Search = memo(({ 
  value = '', 
  onChange, 
  disabled = false 
}) => (
  <div className="flex justify-center mb-6">
    <div className="relative w-64">
      <SearchIcon 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
      />
      <TextField
        size="small"
        variant="outlined"
        placeholder="Search categories..."
        value={value}
        onChange={onChange}
        className="w-full"
        InputProps={{
          className: "bg-white shadow-sm pl-10",
          disabled
        }}
      />
    </div>
  </div>
));

Search.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

Search.displayName = 'Search';

export default Search;