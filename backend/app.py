import os
import sys
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
import time
import threading

# Add the parent directory to the Python path so we can import the models
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import our prediction models
from models.arima_model import ARIMAModel
from models.prophet_model import ProphetModel
from models.ml_model import MLModel

# Initialize Flask app with static files from frontend build
app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key')
socketio = SocketIO(app, cors_allowed_origins="*")

# Store active stock symbols being tracked
active_stocks = set()
# Store prediction models
prediction_models = {}

# Serve the React frontend
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

# Serve static files
@app.route('/<path:path>')
def serve_static(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/stock/history', methods=['GET'])
def get_stock_history():
    """Get historical stock data for a given symbol and period."""
    symbol = request.args.get('symbol', 'AAPL')
    period = request.args.get('period', '1y')
    interval = request.args.get('interval', '1d')
    
    try:
        stock = yf.Ticker(symbol)
        history = stock.history(period=period, interval=interval)
        
        # Convert to JSON-serializable format
        history_dict = {
            'dates': history.index.strftime('%Y-%m-%d').tolist(),
            'open': history['Open'].tolist(),
            'high': history['High'].tolist(),
            'low': history['Low'].tolist(),
            'close': history['Close'].tolist(),
            'volume': history['Volume'].tolist()
        }
        
        return jsonify({
            'success': True,
            'data': history_dict,
            'symbol': symbol
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/stock/info', methods=['GET'])
def get_stock_info():
    """Get basic information about a stock."""
    symbol = request.args.get('symbol', 'AAPL')
    
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        
        # Extract relevant information
        relevant_info = {
            'symbol': symbol,
            'name': info.get('shortName', 'Unknown'),
            'sector': info.get('sector', 'Unknown'),
            'industry': info.get('industry', 'Unknown'),
            'marketCap': info.get('marketCap', 0),
            'currentPrice': info.get('currentPrice', 0),
            'previousClose': info.get('previousClose', 0),
            'open': info.get('open', 0),
            'dayHigh': info.get('dayHigh', 0),
            'dayLow': info.get('dayLow', 0),
            'volume': info.get('volume', 0),
            'averageVolume': info.get('averageVolume', 0),
            'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0),
            'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0),
            'trailingPE': info.get('trailingPE', 0),
            'forwardPE': info.get('forwardPE', 0),
            'dividendYield': info.get('dividendYield', 0) if info.get('dividendYield') else 0,
        }
        
        return jsonify({
            'success': True,
            'data': relevant_info
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/predict', methods=['POST'])
def predict_stock():
    """Generate stock price predictions using the specified model."""
    data = request.json
    symbol = data.get('symbol', 'AAPL')
    model_type = data.get('model', 'arima')  # arima, prophet, ml
    days_ahead = int(data.get('days', 7))
    
    try:
        # Get historical data for training
        stock = yf.Ticker(symbol)
        history = stock.history(period='1y')
        
        # Initialize the appropriate model
        if model_type == 'arima':
            model = ARIMAModel()
        elif model_type == 'prophet':
            model = ProphetModel()
        else:  # ml
            model = MLModel()
        
        # Train the model and get predictions
        predictions = model.predict(history, days_ahead)
        
        # Store the model for real-time updates
        model_key = f"{symbol}_{model_type}"
        prediction_models[model_key] = model
        
        # Add the stock to active stocks for real-time updates
        active_stocks.add(symbol)
        
        return jsonify({
            'success': True,
            'data': {
                'symbol': symbol,
                'model': model_type,
                'predictions': predictions
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/available-stocks', methods=['GET'])
def get_available_stocks():
    """Get a list of popular stocks that can be tracked."""
    popular_stocks = [
        {'symbol': 'AAPL', 'name': 'Apple Inc.'},
        {'symbol': 'MSFT', 'name': 'Microsoft Corporation'},
        {'symbol': 'GOOGL', 'name': 'Alphabet Inc.'},
        {'symbol': 'AMZN', 'name': 'Amazon.com, Inc.'},
        {'symbol': 'META', 'name': 'Meta Platforms, Inc.'},
        {'symbol': 'TSLA', 'name': 'Tesla, Inc.'},
        {'symbol': 'NVDA', 'name': 'NVIDIA Corporation'},
        {'symbol': 'JPM', 'name': 'JPMorgan Chase & Co.'},
        {'symbol': 'V', 'name': 'Visa Inc.'},
        {'symbol': 'JNJ', 'name': 'Johnson & Johnson'}
    ]
    
    return jsonify({
        'success': True,
        'data': popular_stocks
    })

@socketio.on('connect')
def handle_connect():
    """Handle client connection to WebSocket."""
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection from WebSocket."""
    print('Client disconnected')

@socketio.on('track_stock')
def handle_track_stock(data):
    """Start tracking a stock for real-time updates."""
    symbol = data.get('symbol')
    if symbol:
        active_stocks.add(symbol)
        emit('message', {'status': 'success', 'message': f'Now tracking {symbol}'})

@socketio.on('untrack_stock')
def handle_untrack_stock(data):
    """Stop tracking a stock for real-time updates."""
    symbol = data.get('symbol')
    if symbol and symbol in active_stocks:
        active_stocks.remove(symbol)
        emit('message', {'status': 'success', 'message': f'Stopped tracking {symbol}'})

def send_stock_updates():
    """Background thread to send real-time stock updates to clients."""
    while True:
        if active_stocks:
            for symbol in list(active_stocks):
                try:
                    # Get latest stock data
                    stock = yf.Ticker(symbol)
                    latest_data = stock.history(period='1d', interval='1m').iloc[-1]
                    
                    # Update predictions for each model type
                    predictions = {}
                    for model_type in ['arima', 'prophet', 'ml']:
                        model_key = f"{symbol}_{model_type}"
                        if model_key in prediction_models:
                            model = prediction_models[model_key]
                            # Update prediction with new data point
                            updated_pred = model.update_prediction(latest_data)
                            predictions[model_type] = updated_pred
                    
                    # Emit the update to all connected clients
                    socketio.emit('stock_update', {
                        'symbol': symbol,
                        'timestamp': datetime.now().isoformat(),
                        'price': latest_data['Close'],
                        'change': latest_data['Close'] - latest_data['Open'],
                        'predictions': predictions
                    })
                except Exception as e:
                    print(f"Error updating {symbol}: {str(e)}")
        
        # Sleep for 5 seconds before next update
        time.sleep(5)

if __name__ == '__main__':
    # Start the background thread for real-time updates
    update_thread = threading.Thread(target=send_stock_updates)
    update_thread.daemon = True
    update_thread.start()
    
    # Start the Flask app with environment variable configuration
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'True') == 'True'
    socketio.run(app, debug=debug, host='0.0.0.0', port=port) 