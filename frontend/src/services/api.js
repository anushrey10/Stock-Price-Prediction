import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

/**
 * Get historical stock data
 * @param {string} symbol - Stock symbol
 * @param {string} period - Time period (e.g., '1y', '6m', '1mo')
 * @param {string} interval - Data interval (e.g., '1d', '1h', '15m')
 * @returns {Promise} - Promise with stock history data
 */
export const getStockHistory = async (symbol, period = '1y', interval = '1d') => {
  try {
    const response = await axios.get(`${API_URL}/stock/history`, {
      params: { symbol, period, interval }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching stock history:', error);
    throw error;
  }
};

/**
 * Get stock information
 * @param {string} symbol - Stock symbol
 * @returns {Promise} - Promise with stock information
 */
export const getStockInfo = async (symbol) => {
  try {
    const response = await axios.get(`${API_URL}/stock/info`, {
      params: { symbol }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching stock info:', error);
    throw error;
  }
};

/**
 * Generate stock price predictions
 * @param {string} symbol - Stock symbol
 * @param {string} model - Prediction model ('arima', 'prophet', 'ml')
 * @param {number} days - Number of days to predict
 * @returns {Promise} - Promise with prediction data
 */
export const predictStock = async (symbol, model = 'arima', days = 7) => {
  try {
    const response = await axios.post(`${API_URL}/predict`, {
      symbol,
      model,
      days
    });
    return response.data;
  } catch (error) {
    console.error(`Error generating ${model} prediction:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Get list of available stocks
 * @returns {Promise} - Promise with list of available stocks
 */
export const getAvailableStocks = async () => {
  try {
    const response = await axios.get(`${API_URL}/available-stocks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available stocks:', error);
    throw error;
  }
}; 