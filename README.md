# Real-Time Stock Price Predictor

An interactive web application that predicts stock prices in real-time using machine learning algorithms.

## Features

- Real-time stock data fetching
- Interactive price charts with historical data
- Multiple prediction models (ARIMA, Prophet, LSTM)
- User-friendly dashboard with customizable settings
- Real-time updates via WebSockets
- Performance metrics for prediction accuracy

## Project Structure

```
Stock-Price-Prediction/
├── backend/           # Flask server and API endpoints
├── frontend/          # React frontend application
├── data/              # Data storage and processing
├── models/            # ML model definitions and training scripts
├── requirements.txt   # Python dependencies
└── README.md          # Project documentation
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the Flask server:
   ```
   python backend/app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter a stock symbol (e.g., AAPL, MSFT, GOOGL)
3. Select prediction timeframe and model
4. View real-time predictions and historical performance

## Technologies Used

- **Backend**: Flask, pandas, scikit-learn, Prophet, yfinance
- **Frontend**: React, Chart.js, Material-UI
- **Real-time Communication**: Flask-SocketIO, Socket.io-client
- **Data Sources**: Yahoo Finance API

## License

MIT 