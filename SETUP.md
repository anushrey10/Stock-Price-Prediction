# Stock Price Predictor - Setup Guide

This document provides instructions on how to set up and run the Stock Price Predictor application.

## Prerequisites

- Python 3.8+ with pip
- Node.js 14+ with npm
- Git

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Stock-Price-Predictor
```

### 2. Set up the backend

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

### 3. Set up the frontend

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

## Running the Application

### 1. Start the backend server

From the root directory, with the virtual environment activated:

```bash
python backend/app.py
```

The Flask server will start on http://localhost:5000.

### 2. Start the frontend development server

In a new terminal, navigate to the frontend directory:

```bash
cd frontend
npm start
```

The React development server will start on http://localhost:3000.

### 3. Access the application

Open your web browser and navigate to:

```
http://localhost:3000
```

## Using the Application

1. Use the search bar in the top-right corner to search for a stock symbol (e.g., AAPL, MSFT, GOOGL).
2. View the historical price chart and real-time updates.
3. Explore predictions from different models (ARIMA, Prophet, Machine Learning).
4. Compare model performance and predictions.

## Troubleshooting

- If you encounter issues with the Prophet library installation, you may need to install additional dependencies. See the [Prophet documentation](https://facebook.github.io/prophet/docs/installation.html) for details.
- If the backend fails to connect to the Yahoo Finance API, check your internet connection or try a different stock symbol.
- For any other issues, check the console logs in your browser and the terminal running the backend server.

## Notes

- The real-time updates are simulated for demonstration purposes. In a production environment, you would connect to a real-time stock data provider.
- The prediction models are simplified for demonstration. For production use, more sophisticated models with proper validation would be recommended.
- This application is for educational purposes only and should not be used for actual investment decisions. 