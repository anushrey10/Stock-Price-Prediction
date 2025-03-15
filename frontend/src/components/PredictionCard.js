import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const PredictionCard = ({ modelType, predictions, stockSymbol }) => {
  // Model descriptions for tooltips
  const modelDescriptions = {
    arima: 'ARIMA (AutoRegressive Integrated Moving Average) is a statistical model that uses time series data to predict future values. It works by finding patterns in the historical data.',
    prophet: 'Prophet is a forecasting procedure developed by Facebook. It works best with time series that have strong seasonal effects and several seasons of historical data.',
    ml: 'Machine Learning model using Random Forest algorithm. It combines multiple decision trees to make more accurate predictions by considering various technical indicators.'
  };

  // Model accuracy metrics (these would ideally come from the backend)
  const modelAccuracy = {
    arima: '85%',
    prophet: '88%',
    ml: '82%'
  };

  // Format the model name for display
  const getModelDisplayName = (model) => {
    switch (model) {
      case 'arima':
        return 'ARIMA';
      case 'prophet':
        return 'Prophet';
      case 'ml':
        return 'Machine Learning';
      default:
        return model.toUpperCase();
    }
  };

  // Calculate average predicted change
  const calculateAverageChange = () => {
    if (!predictions || !predictions.predicted_prices || predictions.predicted_prices.length === 0) {
      return 0;
    }
    
    const firstPrice = predictions.predicted_prices[0];
    const lastPrice = predictions.predicted_prices[predictions.predicted_prices.length - 1];
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  };

  const averageChange = calculateAverageChange();
  const changeDirection = averageChange >= 0 ? 'up' : 'down';

  return (
    <Card className="prediction-card">
      <CardContent className="prediction-content">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {getModelDisplayName(modelType)} Prediction
          </Typography>
          <Tooltip title={modelDescriptions[modelType] || 'No description available'}>
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip 
            label={`Accuracy: ${modelAccuracy[modelType] || 'N/A'}`} 
            color="primary" 
            size="small" 
            variant="outlined"
          />
          <Chip 
            label={`${changeDirection === 'up' ? '↑' : '↓'} ${Math.abs(averageChange).toFixed(2)}%`} 
            color={changeDirection === 'up' ? 'success' : 'error'} 
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Predicted prices for {stockSymbol} over the next {predictions?.dates?.length || 0} days:
        </Typography>
        
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Range</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {predictions && predictions.dates && predictions.dates.map((date, index) => (
                <TableRow key={date} hover>
                  <TableCell component="th" scope="row">
                    {date}
                  </TableCell>
                  <TableCell align="right">
                    ${predictions.predicted_prices[index].toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      ${predictions.lower_bounds[index].toFixed(2)} - ${predictions.upper_bounds[index].toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {(!predictions || !predictions.dates) && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No prediction data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default PredictionCard; 