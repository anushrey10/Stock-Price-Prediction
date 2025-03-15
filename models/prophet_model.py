import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings("ignore")

class ProphetModel:
    """Facebook Prophet model for stock price prediction."""
    
    def __init__(self):
        self.model = None
        self.history = None
        self.last_date = None
        self.forecast = None
    
    def predict(self, history_df, days_ahead=7):
        """
        Train Prophet model and generate predictions.
        
        Args:
            history_df: DataFrame with historical stock prices
            days_ahead: Number of days to predict ahead
            
        Returns:
            Dictionary with dates, predicted prices, and confidence intervals
        """
        try:
            # Store the history for later updates
            self.history = history_df.copy()
            
            # Prepare data for Prophet (requires 'ds' for dates and 'y' for values)
            prophet_df = pd.DataFrame({
                'ds': pd.DatetimeIndex(history_df.index).tz_localize(None),  # Remove timezone info
                'y': history_df['Close'].values
            })
            
            # Initialize and fit the model
            self.model = Prophet(
                daily_seasonality=True,
                yearly_seasonality=True,
                weekly_seasonality=True,
                changepoint_prior_scale=0.05,  # Flexibility of the trend
                interval_width=0.95  # 95% confidence interval
            )
            
            # Add stock market seasonality (closed on weekends)
            self.model.add_country_holidays(country_name='US')
            
            # Fit the model
            self.model.fit(prophet_df)
            
            # Create future dataframe for prediction
            future = self.model.make_future_dataframe(periods=days_ahead)
            
            # Remove weekends from prediction
            future['day_of_week'] = future['ds'].dt.dayofweek
            future = future[future['day_of_week'] < 5]  # Keep only weekdays
            
            # Generate forecast
            self.forecast = self.model.predict(future)
            
            # Extract the forecast for the future dates
            forecast_df = self.forecast[self.forecast['ds'] > prophet_df['ds'].max()]
            
            # Format the results
            predictions = {
                'dates': forecast_df['ds'].dt.strftime('%Y-%m-%d').tolist(),
                'predicted_prices': forecast_df['yhat'].tolist(),
                'lower_bounds': forecast_df['yhat_lower'].tolist(),
                'upper_bounds': forecast_df['yhat_upper'].tolist()
            }
            
            # Store the last date for updates
            self.last_date = history_df.index[-1]
            
            return predictions
        
        except Exception as e:
            print(f"Prophet model error: {str(e)}")
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
            
            # Prepare updated data for Prophet
            prophet_df = pd.DataFrame({
                'ds': pd.DatetimeIndex(self.history.index).tz_localize(None),  # Remove timezone info
                'y': self.history['Close'].values
            })
            
            # Refit the model with the updated data
            self.model.fit(prophet_df)
            
            # Create future dataframe for prediction (just 1 day ahead)
            future = self.model.make_future_dataframe(periods=1)
            
            # Remove weekends from prediction
            future['day_of_week'] = future['ds'].dt.dayofweek
            future = future[future['day_of_week'] < 5]
            
            # Generate updated forecast
            updated_forecast = self.model.predict(future)
            
            # Extract the forecast for the next day
            next_day_forecast = updated_forecast[updated_forecast['ds'] > prophet_df['ds'].max()]
            
            if not next_day_forecast.empty:
                # Return the updated prediction
                return {
                    'next_price': float(next_day_forecast['yhat'].iloc[0]),
                    'lower_bound': float(next_day_forecast['yhat_lower'].iloc[0]),
                    'upper_bound': float(next_day_forecast['yhat_upper'].iloc[0]),
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return None
        
        except Exception as e:
            print(f"Error updating Prophet prediction: {str(e)}")
            return None
    
    def _fallback_prediction(self, history_df, days_ahead):
        """Simple moving average fallback prediction when Prophet fails."""
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