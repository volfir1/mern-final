import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
  List,
  Box,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { countries } from 'countries-list';

// Convert countries object to array and add needed properties
const countriesList = Object.entries(countries)
  .map(([code, data]) => ({
    name: data.name,
    code,
    flag: data.emoji,
    currency: Array.isArray(data.currency) ? data.currency[0] : data.currency || '',
    phone: data.phone,
    languages: data.languages,
    continent: data.continent
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const SupplierCountryDialog = ({
  open,
  onClose,
  onSelect,
  selectedCountry
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return countriesList;
    
    return countriesList.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      (country.currency && country.currency.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleCountrySelect = (country) => {
    onSelect({
      name: country.name,
      code: country.code,
      flag: country.flag,
      currency: country.currency,
      phoneCode: country.phone
    });
    onClose();
  };

  const renderCountryInfo = (country) => (
    <Box className="flex items-center gap-2">
      <span className="text-xl">{country.flag}</span>
      <Box className="flex-1">
        <Typography variant="subtitle1" component="span">
          {country.name}
        </Typography>
        <Typography 
          variant="caption" 
          color="textSecondary" 
          className="ml-2"
        >
          ({country.code})
        </Typography>
      </Box>
      {country.currency && (
        <Chip
          size="small"
          label={country.currency}
          color="primary"
          variant="outlined"
          className="ml-2"
        />
      )}
      {country.phone && (
        <Tooltip title="Country calling code">
          <Typography 
            variant="caption" 
            color="textSecondary" 
            className="whitespace-nowrap"
          >
            +{country.phone}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "max-h-[90vh]"
      }}
    >
      <DialogTitle>
        <Box className="flex justify-between items-center">
          <Typography>Select Country</Typography>
          <IconButton onClick={onClose} size="small" className="ml-2">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search by country name, code, or currency..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="my-4"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => setSearchQuery('')}
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {filteredCountries.length === 0 ? (
          <Box className="p-4 text-center text-gray-500">
            <Typography>No countries found matching your search</Typography>
          </Box>
        ) : (
          <List className="max-h-[calc(90vh-200px)] overflow-auto">
            {filteredCountries.map((country) => (
              <ListItem
                key={country.code}
                disablePadding
                className="hover:bg-gray-50 transition-colors"
              >
                <ListItemButton
                  onClick={() => handleCountrySelect(country)}
                  selected={selectedCountry === country.name}
                >
                  <ListItemText>
                    {renderCountryInfo(country)}
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
        
        <Box className="mt-4 p-2 bg-gray-50 rounded-md">
          <Typography variant="caption" color="textSecondary" className="flex items-center gap-1">
            <InfoIcon fontSize="small" />
            {filteredCountries.length} countries found
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

SupplierCountryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedCountry: PropTypes.string
};

export default SupplierCountryDialog;