import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Paper } from '@mui/material';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
Chart.register(...registerables);

const StockChart = ({ historicalData, realTimeData, predictions }) => {
  const [timeRange, setTimeRange] = useState('1y');
  const [showPredictions, setShowPredictions] = useState(true);
  const [selectedModel, setSelectedModel] = useState('arima');
  const chartRef = useRef(null);

  // Handle time range change
  const handleTimeRangeChange = (event, newTimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  // Handle prediction toggle
  const handlePredictionToggle = (event, newShowPredictions) => {
    if (newShowPredictions !== null) {
      setShowPredictions(newShowPredictions);
    }
  };

  // Handle model selection
  const handleModelChange = (event, newModel) => {
    if (newModel !== null) {
      setSelectedModel(newModel);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!historicalData) return null;

    // Filter data based on selected time range
    let filteredDates = [...historicalData.dates];
    let filteredPrices = [...historicalData.close];

    if (timeRange === '1m') {
      const cutoff = filteredDates.length - 30;
      filteredDates = filteredDates.slice(cutoff);
      filteredPrices = filteredPrices.slice(cutoff);
    } else if (timeRange === '3m') {
      const cutoff = filteredDates.length - 90;
      filteredDates = filteredDates.slice(cutoff);
      filteredPrices = filteredPrices.slice(cutoff);
    } else if (timeRange === '6m') {
      const cutoff = filteredDates.length - 180;
      filteredDates = filteredDates.slice(cutoff);
      filteredPrices = filteredPrices.slice(cutoff);
    }

    // Add real-time data if available
    if (realTimeData && realTimeData.length > 0) {
      realTimeData.forEach(data => {
        filteredDates.push(data.timestamp);
        filteredPrices.push(data.price);
      });
    }

    // Prepare datasets
    const datasets = [
      {
        label: 'Historical Price',
        data: filteredPrices,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointRadius: 1,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.1,
        fill: false
      }
    ];

    // Add prediction data if available and enabled
    if (showPredictions && predictions && predictions[selectedModel]) {
      const predictionData = predictions[selectedModel];
      
      // Add prediction line
      datasets.push({
        label: `${selectedModel.toUpperCase()} Prediction`,
        data: predictionData.predicted_prices,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        pointRadius: 3,
        pointHoverRadius: 7,
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false,
        xAxisID: 'x2'
      });
      
      // Add confidence interval
      datasets.push({
        label: 'Confidence Interval',
        data: predictionData.upper_bounds,
        borderColor: 'rgba(255, 159, 64, 0.3)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        pointRadius: 0,
        borderWidth: 1,
        tension: 0.1,
        fill: '+1',
        xAxisID: 'x2'
      });
      
      datasets.push({
        label: 'Lower Bound',
        data: predictionData.lower_bounds,
        borderColor: 'rgba(255, 159, 64, 0.3)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        pointRadius: 0,
        borderWidth: 1,
        tension: 0.1,
        fill: false,
        xAxisID: 'x2'
      });
    }

    return {
      labels: filteredDates,
      datasets,
      predictionDates: predictions && predictions[selectedModel] ? predictions[selectedModel].dates : []
    };
  };

  const chartData = prepareChartData();

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(tooltipItems) {
            const idx = tooltipItems[0].dataIndex;
            const datasetIdx = tooltipItems[0].datasetIndex;
            
            if (datasetIdx > 0 && chartData.predictionDates) {
              // For prediction datasets
              return chartData.predictionDates[idx];
            } else {
              // For historical data
              return chartData.labels[idx];
            }
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          filter: function(legendItem) {
            // Hide the "Lower Bound" label
            return legendItem.text !== 'Lower Bound';
          }
        }
      },
      title: {
        display: true,
        text: 'Stock Price History & Prediction',
        font: {
          size: 16
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '1m' ? 'day' : 'month',
          tooltipFormat: 'PP',
          displayFormats: {
            day: 'MMM d',
            month: 'MMM yyyy'
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      x2: {
        type: 'category',
        labels: chartData && chartData.predictionDates ? chartData.predictionDates : [],
        display: false,
        grid: {
          drawOnChartArea: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Price ($)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          aria-label="time range"
          size="small"
        >
          <ToggleButton value="1m" aria-label="1 month">
            1M
          </ToggleButton>
          <ToggleButton value="3m" aria-label="3 months">
            3M
          </ToggleButton>
          <ToggleButton value="6m" aria-label="6 months">
            6M
          </ToggleButton>
          <ToggleButton value="1y" aria-label="1 year">
            1Y
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={showPredictions}
            exclusive
            onChange={handlePredictionToggle}
            aria-label="show predictions"
            size="small"
          >
            <ToggleButton value={true} aria-label="show predictions">
              Show Predictions
            </ToggleButton>
            <ToggleButton value={false} aria-label="hide predictions">
              Hide Predictions
            </ToggleButton>
          </ToggleButtonGroup>

          {showPredictions && (
            <ToggleButtonGroup
              value={selectedModel}
              exclusive
              onChange={handleModelChange}
              aria-label="prediction model"
              size="small"
            >
              {Object.keys(predictions || {}).map((model) => (
                <ToggleButton key={model} value={model} aria-label={model}>
                  {model.toUpperCase()}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        </Box>
      </Box>

      <div className="chart-container">
        {chartData ? (
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        ) : (
          <Typography variant="body1" align="center">
            Loading chart data...
          </Typography>
        )}
      </div>

      {realTimeData && realTimeData.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Latest Price
            </Typography>
            <Typography variant="h6">
              ${realTimeData[realTimeData.length - 1].price.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Change
            </Typography>
            <Typography 
              variant="h6" 
              className={realTimeData[realTimeData.length - 1].change >= 0 ? 'price-up' : 'price-down'}
            >
              {realTimeData[realTimeData.length - 1].change >= 0 ? '+' : ''}
              ${Math.abs(realTimeData[realTimeData.length - 1].change).toFixed(2)} 
              ({((realTimeData[realTimeData.length - 1].change / (realTimeData[realTimeData.length - 1].price - realTimeData[realTimeData.length - 1].change)) * 100).toFixed(2)}%)
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="h6">
              {new Date(realTimeData[realTimeData.length - 1].timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default StockChart; 