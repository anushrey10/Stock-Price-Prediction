import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import joblib
import os
import warnings
warnings.filterwarnings("ignore")

class MLModel:
    """Machine Learning model for stock price prediction using Random Forest."""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.history = None
        self.last_date = None
        self.feature_columns = None
    
    def predict(self, history_df, days_ahead=7):
        """
        Train ML model and generate predictions.
        
        Args:
            history_df: DataFrame with historical stock prices
            days_ahead: Number of days to predict ahead
            
        Returns:
            Dictionary with dates, predicted prices, and confidence intervals
        """
        try:
            # Store the history for later updates
            self.history = history_df.copy()
            
            # Create features from the time series data
            features_df = self._create_features(history_df)
            self.feature_columns = features_df.columns
            
            # Split data into features and target
            X = features_df.values
            y = history_df['Close'].values
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train Random Forest model
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.model.fit(X_scaled, y)
            
            # Generate predictions for future days
            future_predictions = []
            prediction_std = []
            
            # Make a copy of the latest data for prediction
            current_data = history_df.copy().iloc[-1:]
            last_date = history_df.index[-1]
            self.last_date = last_date
            
            # Generate dates for the forecast period
            forecast_dates = []
            for i in range(1, days_ahead + 1):
                next_date = last_date + timedelta(days=i)
                # Skip weekends
                while next_date.weekday() > 4:  # 5 = Saturday, 6 = Sunday
                    next_date = next_date + timedelta(days=1)
                forecast_dates.append(next_date)
                
                # Create features for this future date
                # For simplicity, we'll use the last known values and update them
                # with our predictions as we go
                if i > 1:
                    current_data = pd.DataFrame({
                        'Open': [future_predictions[-1]],
                        'High': [future_predictions[-1] * 1.01],  # Estimate
                        'Low': [future_predictions[-1] * 0.99],   # Estimate
                        'Close': [future_predictions[-1]],
                        'Volume': [history_df['Volume'].mean()]   # Use average volume
                    }, index=[next_date])
                
                # Create features for prediction
                future_features = self._create_features(current_data)
                future_X = future_features.values
                future_X_scaled = self.scaler.transform(future_X)
                
                # Make prediction
                # For Random Forest, we can get individual tree predictions
                tree_predictions = [tree.predict(future_X_scaled)[0] for tree in self.model.estimators_]
                prediction = np.mean(tree_predictions)
                std = np.std(tree_predictions)
                
                future_predictions.append(prediction)
                prediction_std.append(std)
            
            # Format the results
            predictions = {
                'dates': [date.strftime('%Y-%m-%d') for date in forecast_dates],
                'predicted_prices': future_predictions,
                'lower_bounds': [p - 1.96 * s for p, s in zip(future_predictions, prediction_std)],
                'upper_bounds': [p + 1.96 * s for p, s in zip(future_predictions, prediction_std)]
            }
            
            return predictions
        
        except Exception as e:
            print(f"ML model error: {str(e)}")
            # Return a simple moving average forecast as fallback
            return self._fallback_prediction(history_df, days_ahead)
    
    def update_prediction(self, new_data_point):
        """
        Update the prediction with a new data point.
        
        Args:
            new_data_point: New stock price data point
            
        Returns:
            Updated prediction
        """
        if self.model is None or self.history is None:
            return None
        
        try:
            # Add the new data point to history
            new_row = pd.DataFrame([new_data_point])
            self.history = pd.concat([self.history, new_row])
            
            # Create features from updated history
            features_df = self._create_features(self.history)
            
            # Split data into features and target
            X = features_df.values
            y = self.history['Close'].values
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Retrain the model with updated data
            self.model.fit(X_scaled, y)
            
            # Make prediction for the next day
            next_date = self.history.index[-1] + timedelta(days=1)
            # Skip weekends
            while next_date.weekday() > 4:
                next_date = next_date + timedelta(days=1)
            
            # Create features for the next day
            next_day_data = pd.DataFrame({
                'Open': [new_data_point['Close']],
                'High': [new_data_point['Close'] * 1.01],  # Estimate
                'Low': [new_data_point['Close'] * 0.99],   # Estimate
                'Close': [new_data_point['Close']],
                'Volume': [self.history['Volume'].mean()]   # Use average volume
            }, index=[next_date])
            
            next_day_features = self._create_features(next_day_data)
            next_day_X = next_day_features.values
            next_day_X_scaled = self.scaler.transform(next_day_X)
            
            # Get predictions from all trees
            tree_predictions = [tree.predict(next_day_X_scaled)[0] for tree in self.model.estimators_]
            prediction = np.mean(tree_predictions)
            std = np.std(tree_predictions)
            
            # Return the updated prediction
            return {
                'next_price': float(prediction),
                'lower_bound': float(prediction - 1.96 * std),
                'upper_bound': float(prediction + 1.96 * std),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            print(f"Error updating ML prediction: {str(e)}")
            return None
    
    def _create_features(self, df):
        """Create features for the ML model from time series data."""
        df_copy = df.copy()
        
        # Technical indicators
        # Moving averages
        df_copy['MA5'] = df_copy['Close'].rolling(window=5).mean()
        df_copy['MA10'] = df_copy['Close'].rolling(window=10).mean()
        df_copy['MA20'] = df_copy['Close'].rolling(window=20).mean()
        
        # Price momentum
        df_copy['Price_Change'] = df_copy['Close'].pct_change()
        df_copy['Price_Change_5'] = df_copy['Close'].pct_change(periods=5)
        
        # Volatility
        df_copy['Volatility'] = df_copy['Close'].rolling(window=10).std()
        
        # Trading volume features
        df_copy['Volume_Change'] = df_copy['Volume'].pct_change()
        df_copy['Volume_MA5'] = df_copy['Volume'].rolling(window=5).mean()
        
        # Price range
        df_copy['Daily_Range'] = (df_copy['High'] - df_copy['Low']) / df_copy['Open']
        
        # Relative Strength Index (simplified)
        delta = df_copy['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df_copy['RSI'] = 100 - (100 / (1 + rs))
        
        # Fill NaN values that result from calculations
        df_copy = df_copy.fillna(method='bfill')
        
        # Select features for the model
        features = df_copy[['Open', 'High', 'Low', 'Close', 'Volume', 
                           'MA5', 'MA10', 'MA20', 'Price_Change', 'Price_Change_5',
                           'Volatility', 'Volume_Change', 'Volume_MA5', 'Daily_Range', 'RSI']]
        
        return features
    
    def _fallback_prediction(self, history_df, days_ahead):
        """Simple moving average fallback prediction when ML model fails."""
        closing_prices = history_df['Close'].values
        # Use a 5-day moving average
        avg_price = np.mean(closing_prices[-5:])
        
        # Generate dates for the forecast period
        last_date = history_df.index[-1]
        self.last_date = last_date
        
        forecast_dates = []
        for i in range(1, days_ahead + 1):
            next_date = last_date + timedelta(days=i)
            # Skip weekends
            while next_date.weekday() > 4:
                next_date = next_date + timedelta(days=1)
            forecast_dates.append(next_date)
        
        # Create a simple forecast with slight random variation
        forecast = [avg_price + (np.random.random() - 0.5) * 0.02 * avg_price for _ in range(len(forecast_dates))]
        std_error = np.std(closing_prices) * 1.96 / np.sqrt(len(closing_prices))
        
        # Format the results
        predictions = {
            'dates': [date.strftime('%Y-%m-%d') for date in forecast_dates],
            'predicted_prices': forecast,
            'lower_bounds': [price - std_error for price in forecast],
            'upper_bounds': [price + std_error for price in forecast]
        }
        
        return predictions 