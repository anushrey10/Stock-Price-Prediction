import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings("ignore")

class ARIMAModel:
    """ARIMA time series model for stock price prediction."""
    
    def __init__(self):
        self.model = None
        self.history = None
        self.last_date = None
        self.forecast = None
        self.confidence_intervals = None
    
    def predict(self, history_df, days_ahead=7):
        """
        Train ARIMA model and generate predictions.
        
        Args:
            history_df: DataFrame with historical stock prices
            days_ahead: Number of days to predict ahead
            
        Returns:
            Dictionary with dates, predicted prices, and confidence intervals
        """
        # Store the history for later updates
        self.history = history_df.copy()
        
        # Extract the closing prices
        closing_prices = history_df['Close'].values
        
        # Fit ARIMA model (p,d,q) = (5,1,0)
        # These parameters can be optimized using auto_arima from pmdarima
        try:
            self.model = ARIMA(closing_prices, order=(5, 1, 0))
            model_fit = self.model.fit()
            
            # Generate forecast
            forecast_result = model_fit.forecast(steps=days_ahead, alpha=0.05)
            self.forecast = forecast_result
            
            # Generate dates for the forecast period
            last_date = history_df.index[-1]
            self.last_date = last_date
            
            forecast_dates = []
            for i in range(1, days_ahead + 1):
                next_date = last_date + timedelta(days=i)
                # Skip weekends
                while next_date.weekday() > 4:  # 5 = Saturday, 6 = Sunday
                    next_date = next_date + timedelta(days=1)
                forecast_dates.append(next_date)
            
            # Extract confidence intervals if available
            if hasattr(forecast_result, 'conf_int'):
                self.confidence_intervals = forecast_result.conf_int()
                lower_bounds = self.confidence_intervals[:, 0]
                upper_bounds = self.confidence_intervals[:, 1]
            else:
                # Approximate confidence intervals
                std_error = np.std(closing_prices) * 1.96 / np.sqrt(len(closing_prices))
                lower_bounds = forecast_result - std_error
                upper_bounds = forecast_result + std_error
            
            # Format the results
            predictions = {
                'dates': [date.strftime('%Y-%m-%d') for date in forecast_dates],
                'predicted_prices': forecast_result.tolist(),
                'lower_bounds': lower_bounds.tolist(),
                'upper_bounds': upper_bounds.tolist()
            }
            
            return predictions
        
        except Exception as e:
            print(f"ARIMA model error: {str(e)}")
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
            
            # Retrain the model with the updated history
            closing_prices = self.history['Close'].values
            self.model = ARIMA(closing_prices, order=(5, 1, 0))
            model_fit = self.model.fit()
            
            # Generate updated forecast (just 1 day ahead for real-time updates)
            forecast_result = model_fit.forecast(steps=1)
            
            # Return the updated prediction
            return {
                'next_price': float(forecast_result[0]),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            print(f"Error updating ARIMA prediction: {str(e)}")
            return None
    
    def _fallback_prediction(self, history_df, days_ahead):
        """Simple moving average fallback prediction when ARIMA fails."""
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
        forecast = [avg_price + (np.random.random() - 0.5) * 0.02 * avg_price for _ in range(days_ahead)]
        std_error = np.std(closing_prices) * 1.96 / np.sqrt(len(closing_prices))
        
        # Format the results
        predictions = {
            'dates': [date.strftime('%Y-%m-%d') for date in forecast_dates],
            'predicted_prices': forecast,
            'lower_bounds': [price - std_error for price in forecast],
            'upper_bounds': [price + std_error for price in forecast]
        }
        
        return predictions 