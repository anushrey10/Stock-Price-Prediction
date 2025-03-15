import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Paper, Grid, AppBar, Toolbar, CircularProgress } from '@mui/material';
import { io } from 'socket.io-client';
import StockSearch from './components/StockSearch';
import StockChart from './components/StockChart';
import PredictionCard from './components/PredictionCard';
import StockInfo from './components/StockInfo';
import ModelComparison from './components/ModelComparison';
import { getStockHistory, getStockInfo, predictStock } from './services/api';

function App() {
  const [socket, setSocket] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeData, setRealTimeData] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    // Use environment variable if available, otherwise use window.location.origin for production or localhost for development
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 
                     (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5001');
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for real-time stock updates
    socket.on('stock_update', (data) => {
      if (selectedStock && data.symbol === selectedStock.symbol) {
        // Add the new data point to our real-time data array
        setRealTimeData((prevData) => {
          // Keep only the last 100 data points to avoid memory issues
          const newData = [...prevData, data];
          if (newData.length > 100) {
            return newData.slice(newData.length - 100);
          }
          return newData;
        });

        // Update predictions if available
        if (data.predictions) {
          setPredictions((prevPredictions) => ({
            ...prevPredictions,
            ...data.predictions
          }));
        }
      }
    });

    // Listen for server messages
    socket.on('message', (message) => {
      console.log('Server message:', message);
    });

    // Handle connection errors
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to the server. Please try again later.');
    });

    return () => {
      socket.off('stock_update');
      socket.off('message');
      socket.off('connect_error');
    };
  }, [socket, selectedStock]);

  // Handle stock selection
  const handleStockSelect = async (stock) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedStock(stock);
      
      // Reset previous data
      setStockData(null);
      setStockInfo(null);
      setPredictions({});
      setRealTimeData([]);
      
      // Fetch historical data
      const historyResponse = await getStockHistory(stock.symbol);
      setStockData(historyResponse.data);
      
      // Fetch stock info
      const infoResponse = await getStockInfo(stock.symbol);
      setStockInfo(infoResponse.data);
      
      // Start tracking this stock for real-time updates
      if (socket) {
        socket.emit('track_stock', { symbol: stock.symbol });
      }
      
      // Generate predictions with all models
      const models = ['arima', 'prophet', 'ml'];
      const predictionPromises = models.map(model => 
        predictStock(stock.symbol, model, 7)
      );
      
      const predictionResults = await Promise.all(predictionPromises);
      
      // Organize predictions by model
      const predictionsByModel = {};
      predictionResults.forEach((result, index) => {
        if (result.success && result.data && result.data.predictions) {
          predictionsByModel[models[index]] = result.data.predictions;
        } else if (!result.success) {
          console.warn(`${models[index]} model prediction failed:`, result.error);
        }
      });
      
      setPredictions(predictionsByModel);
      
      // Show error if no predictions were successful
      if (Object.keys(predictionsByModel).length === 0) {
        setError('Failed to generate predictions. Please try a different stock or try again later.');
      }
      
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Stock Price Predictor
          </Typography>
          <StockSearch onSelectStock={handleStockSelect} />
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" className="dashboard-container">
        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.dark' }}>
            <Typography color="error.contrastText">{error}</Typography>
          </Paper>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {selectedStock && stockData && !loading && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                {selectedStock.name} ({selectedStock.symbol})
              </Typography>
              
              <Paper sx={{ p: 3, mb: 3 }}>
                <StockChart 
                  historicalData={stockData} 
                  realTimeData={realTimeData}
                  predictions={predictions}
                />
              </Paper>
              
              {stockInfo && (
                <StockInfo stockInfo={stockInfo} />
              )}
            </Box>
            
            <Typography variant="h5" gutterBottom>
              Prediction Models
            </Typography>
            
            <Grid container spacing={3}>
              {Object.keys(predictions).map((model) => (
                <Grid item xs={12} md={4} key={model}>
                  <PredictionCard 
                    modelType={model} 
                    predictions={predictions[model]} 
                    stockSymbol={selectedStock.symbol}
                  />
                </Grid>
              ))}
            </Grid>
            
            {Object.keys(predictions).length > 1 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Model Comparison
                </Typography>
                <Paper sx={{ p: 3 }}>
                  <ModelComparison 
                    predictions={predictions} 
                    stockData={stockData}
                  />
                </Paper>
              </Box>
            )}
          </>
        )}
        
        {!selectedStock && !loading && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '70vh'
          }}>
            <Typography variant="h5" gutterBottom>
              Welcome to Stock Price Predictor
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 600 }}>
              Search for a stock symbol above to view real-time price data and predictions.
              Our application uses multiple machine learning models to forecast future stock prices.
            </Typography>
          </Box>
        )}
      </Container>
    </div>
  );
}

export default App; 