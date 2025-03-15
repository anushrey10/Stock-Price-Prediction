import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const StockInfo = ({ stockInfo }) => {
  // Format large numbers with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  // Format currency values
  const formatCurrency = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format percentage values
  const formatPercentage = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  // Info items to display
  const infoItems = [
    { label: 'Previous Close', value: formatCurrency(stockInfo.previousClose) },
    { label: 'Open', value: formatCurrency(stockInfo.open) },
    { label: 'Day Range', value: `${formatCurrency(stockInfo.dayLow)} - ${formatCurrency(stockInfo.dayHigh)}` },
    { label: '52 Week Range', value: `${formatCurrency(stockInfo.fiftyTwoWeekLow)} - ${formatCurrency(stockInfo.fiftyTwoWeekHigh)}` },
    { label: 'Volume', value: formatNumber(stockInfo.volume) },
    { label: 'Avg. Volume', value: formatNumber(stockInfo.averageVolume) },
    { label: 'Market Cap', value: formatCurrency(stockInfo.marketCap) },
    { label: 'P/E Ratio', value: stockInfo.trailingPE ? stockInfo.trailingPE.toFixed(2) : 'N/A' },
    { label: 'Forward P/E', value: stockInfo.forwardPE ? stockInfo.forwardPE.toFixed(2) : 'N/A' },
    { label: 'Dividend Yield', value: formatPercentage(stockInfo.dividendYield) },
    { label: 'Sector', value: stockInfo.sector || 'N/A' },
    { label: 'Industry', value: stockInfo.industry || 'N/A' }
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Stock Information
      </Typography>
      
      <div className="stock-info-grid">
        {infoItems.map((item, index) => (
          <div key={index} className="stock-info-item">
            <div className="stock-info-label">{item.label}</div>
            <div className="stock-info-value">{item.value}</div>
          </div>
        ))}
      </div>
    </Paper>
  );
};

export default StockInfo; 