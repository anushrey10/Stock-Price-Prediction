import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress,
  InputAdornment,
  Box
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getAvailableStocks } from '../services/api';

const StockSearch = ({ onSelectStock }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);

  // Fetch available stocks when component mounts
  useEffect(() => {
    let active = true;

    const fetchStocks = async () => {
      setLoading(true);
      try {
        const response = await getAvailableStocks();
        if (active && response.success) {
          setOptions(response.data);
        }
      } catch (error) {
        console.error('Error fetching stocks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();

    return () => {
      active = false;
    };
  }, []);

  // Handle stock selection
  const handleStockChange = (event, newValue) => {
    setSelectedStock(newValue);
    if (newValue) {
      onSelectStock(newValue);
    }
  };

  return (
    <Autocomplete
      id="stock-search"
      sx={{ width: 300 }}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.symbol === value.symbol}
      getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
      options={options}
      loading={loading}
      value={selectedStock}
      onChange={handleStockChange}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search Stocks"
          variant="outlined"
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <strong>{option.symbol}</strong> - {option.name}
        </Box>
      )}
    />
  );
};

export default StockSearch; 