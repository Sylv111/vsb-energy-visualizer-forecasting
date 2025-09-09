#!/usr/bin/env python3
"""
forecast_convlstm.py
--------------------
Time series prediction using ConvLSTM neural network.

Usage:
  python forecast_convlstm.py --file path/to/file.csv --x COL_X --y COL_Y --n 50

Arguments:
  --file FILE         Path to input CSV file
  --x COL_X           Name of increment/index column (must be numeric)
  --y COL_Y           Name of target column to predict
  --n N_PRED          Number of points to predict/append

Features:
- Uses ConvLSTM for robust time series forecasting
- Preserves original data precision
- Creates new CSV file with predictions appended (original file unchanged)
- Handles missing values gracefully
- Supports P50 predictions (median/central tendency)
"""

import argparse
import os
import sys
import warnings
from typing import List, Tuple

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import ConvLSTM2D, Dense, Flatten, Reshape
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error

warnings.filterwarnings("ignore", category=UserWarning)
tf.get_logger().setLevel('ERROR')


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    p = argparse.ArgumentParser(description="Time series prediction with ConvLSTM.")
    p.add_argument("--file", required=True, help="Path to input CSV file")
    p.add_argument("--x", dest="col_x", required=True, help="Name of increment/index column")
    p.add_argument("--y", dest="col_y", required=True, help="Name of target column to predict")
    p.add_argument("--n", dest="n_pred", type=int, required=True, help="Number of points to predict")
    return p.parse_args()


def detect_precision(data: np.ndarray) -> int:
    """Detect precision (decimal places) of input data."""
    data_clean = data[~np.isnan(data)]
    if len(data_clean) == 0:
        return 0
    
    sample_size = min(100, len(data_clean))
    sample_indices = np.random.choice(len(data_clean), sample_size, replace=False)
    sample_values = data_clean[sample_indices]
    
    max_decimals = 0
    for val in sample_values:
        val_str = f"{val:.10f}".rstrip('0').rstrip('.')
        if '.' in val_str:
            decimals = len(val_str.split('.')[1])
            max_decimals = max(max_decimals, decimals)
    
    return max_decimals


def round_to_precision(value: float, precision: int) -> float:
    """Round value to specified decimal places."""
    if precision == 0:
        return round(value)
    else:
        return round(value, precision)


def create_sequences(data: np.ndarray, seq_length: int) -> Tuple[np.ndarray, np.ndarray]:
    """Create sequences for ConvLSTM training."""
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:(i + seq_length)])
        y.append(data[i + seq_length])
    return np.array(X), np.array(y)


def build_convlstm_model(seq_length: int, n_features: int = 1) -> tf.keras.Model:
    """Build ConvLSTM model for time series prediction."""
    model = Sequential([
        # Reshape for ConvLSTM2D (samples, time, rows, cols, channels)
        Reshape((seq_length, 1, 1, n_features), input_shape=(seq_length, n_features)),
        
        # ConvLSTM2D layer
        ConvLSTM2D(filters=64, kernel_size=(1, 1), padding='same', 
                  return_sequences=False, activation='tanh'),
        
        # Flatten and dense layers
        Flatten(),
        Dense(50, activation='relu'),
        Dense(25, activation='relu'),
        Dense(1, activation='linear')
    ])
    
    model.compile(optimizer=Adam(learning_rate=0.001), 
                  loss='mse', 
                  metrics=['mae'])
    
    return model


def prepare_data_for_convlstm(data: np.ndarray, seq_length: int = 24) -> Tuple[np.ndarray, np.ndarray]:
    """Prepare data for ConvLSTM training."""
    # Normalize data
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data.reshape(-1, 1)).flatten()
    
    # Create sequences
    X, y = create_sequences(data_scaled, seq_length)
    
    # Reshape for ConvLSTM
    X = X.reshape((X.shape[0], X.shape[1], 1))
    
    return X, y, scaler


def predict_future_convlstm(model: tf.keras.Model, last_sequence: np.ndarray, 
                           n_predictions: int, scaler: MinMaxScaler) -> np.ndarray:
    """Generate future predictions using ConvLSTM model."""
    predictions = []
    current_sequence = last_sequence.copy()
    seq_length = len(last_sequence)
    
    for _ in range(n_predictions):
        # Reshape for prediction - FIXED: use seq_length instead of current_sequence.shape[0]
        input_seq = current_sequence.reshape(1, seq_length, 1)
        
        # Predict next value
        next_pred = model.predict(input_seq, verbose=0)[0, 0]
        predictions.append(next_pred)
        
        # Update sequence (sliding window)
        current_sequence = np.append(current_sequence[1:], next_pred)
    
    # Inverse transform predictions
    predictions = np.array(predictions).reshape(-1, 1)
    predictions = scaler.inverse_transform(predictions).flatten()
    
    return predictions


def main():
    args = parse_args()
    
    # Read CSV file
    try:
        df = pd.read_csv(args.file)
        print(f"INFO: Loaded CSV with {len(df)} rows and {len(df.columns)} columns", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: Cannot read CSV file: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Check if columns exist
    if args.col_x not in df.columns or args.col_y not in df.columns:
        print(f"ERROR: Columns not found. Available columns: {list(df.columns)}", file=sys.stderr)
        sys.exit(2)
    
    # Prepare data
    try:
        x_data = pd.to_numeric(df[args.col_x], errors="coerce")
        y_data = pd.to_numeric(df[args.col_y], errors="coerce")
    except Exception as e:
        print(f"ERROR: Cannot parse columns as numeric: {e}", file=sys.stderr)
        sys.exit(3)
    
    # Handle missing values
    y_data = y_data.fillna(method='ffill').fillna(method='bfill')
    
    # Detect precision
    y_precision = detect_precision(y_data.values)
    x_precision = detect_precision(x_data.values)
    print(f"INFO: Detected precision - Y: {y_precision} decimals, X: {x_precision} decimals", file=sys.stderr)
    
    # Prepare data for ConvLSTM
    seq_length = min(48, len(y_data) // 4)  # Increased from 24 to 48 for better context
    if seq_length < 5:
        seq_length = 5
    
    print(f"INFO: Using sequence length: {seq_length}", file=sys.stderr)
    
    try:
        X, y, scaler = prepare_data_for_convlstm(y_data.values, seq_length)
        # Get scaled data for predictions
        y_scaled = scaler.transform(y_data.values.reshape(-1, 1)).flatten()
        print(f"INFO: Created {len(X)} training sequences", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: Failed to prepare data: {e}", file=sys.stderr)
        sys.exit(4)
    
    # Build and train model
    model = build_convlstm_model(seq_length)
    print(f"INFO: Built ConvLSTM model", file=sys.stderr)
    
    # Train model
    try:
        history = model.fit(X, y, epochs=400, batch_size=32, validation_split=0.2, 
                           verbose=1)
        
        # Calculate and display metrics
        final_loss = history.history['loss'][-1]
        final_val_loss = history.history['val_loss'][-1]
        final_mae = history.history['mae'][-1]
        final_val_mae = history.history['val_mae'][-1]
        
        # Calculate percentage metrics on original data scale
        y_mean = np.mean(y_data.values)
        y_std = np.std(y_data.values)
        y_range = np.max(y_data.values) - np.min(y_data.values)
        
        # Convert normalized metrics back to original scale
        mae_orig_train = final_mae * y_range
        mae_orig_val = final_val_mae * y_range
        rmse_orig_train = np.sqrt(final_loss) * y_range
        rmse_orig_val = np.sqrt(final_val_loss) * y_range
        
        # MAE as percentage of mean
        mae_pct_train = (mae_orig_train / y_mean) * 100
        mae_pct_val = (mae_orig_val / y_mean) * 100
        
        # RMSE as percentage of mean
        rmse_pct_train = (rmse_orig_train / y_mean) * 100
        rmse_pct_val = (rmse_orig_val / y_mean) * 100
        
        print(f"INFO: Model trained successfully", file=sys.stderr)
        print(f"INFO: Data statistics - Mean: {y_mean:.2f}, Std: {y_std:.2f}", file=sys.stderr)
        print(f"INFO: Training Loss (MSE): {final_loss:.6f}", file=sys.stderr)
        print(f"INFO: Validation Loss (MSE): {final_val_loss:.6f}", file=sys.stderr)
        print(f"INFO: Training MAE: {mae_orig_train:.2f} ({mae_pct_train:.2f}% of mean)", file=sys.stderr)
        print(f"INFO: Validation MAE: {mae_orig_val:.2f} ({mae_pct_val:.2f}% of mean)", file=sys.stderr)
        print(f"INFO: Training RMSE: {rmse_orig_train:.2f} ({rmse_pct_train:.2f}% of mean)", file=sys.stderr)
        print(f"INFO: Validation RMSE: {rmse_orig_val:.2f} ({rmse_pct_val:.2f}% of mean)", file=sys.stderr)
        
    except Exception as e:
        print(f"ERROR: Model training failed: {e}", file=sys.stderr)
        sys.exit(5)
    
    # Generate predictions
    try:
        # Use scaled data for prediction, not original data
        last_sequence = y_scaled[-seq_length:]
        predictions = predict_future_convlstm(model, last_sequence, args.n_pred, scaler)
        
        # Round predictions to match original precision
        predictions = [round_to_precision(pred, y_precision) for pred in predictions]
        
        print(f"INFO: Generated {len(predictions)} predictions", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: Prediction generation failed: {e}", file=sys.stderr)
        sys.exit(6)
    
    # Generate future X values
    x_values = x_data.values
    step = np.median(np.diff(x_values[~np.isnan(x_values)]))
    last_x = float(x_values[~np.isnan(x_values)][-1])
    
    future_x = []
    for i in range(args.n_pred):
        x_val = last_x + step * (i + 1)
        future_x.append(round_to_precision(x_val, x_precision))
    
    # Create output DataFrame
    future_rows = pd.DataFrame({col: [np.nan] * args.n_pred for col in df.columns})
    future_rows[args.col_x] = future_x
    future_rows[args.col_y] = predictions
    
    # Combine original and predictions
    output_df = pd.concat([df, future_rows], ignore_index=True)
    
    # Generate output filename
    base_name, ext = os.path.splitext(args.file)
    output_file = f"{base_name}_convlstm_preds{ext}"
    
    # Save output
    try:
        output_df.to_csv(output_file, index=False)
        print(f"INFO: Saved predictions to: {output_file}")
        print(f"INFO: Model: ConvLSTM with sequence length {seq_length}")
        print(f"INFO: Final Training - MAE: {mae_pct_train:.2f}%, RMSE: {rmse_pct_train:.2f}%")
        print(f"INFO: Final Validation - MAE: {mae_pct_val:.2f}%, RMSE: {rmse_pct_val:.2f}%")
        print(f"INFO: Precision preserved: {y_precision} decimal places for Y, {x_precision} decimal places for X")
        print(f"INFO: Appended {args.n_pred} rows")
    except Exception as e:
        print(f"ERROR: Cannot save output file: {e}", file=sys.stderr)
        sys.exit(7)


if __name__ == "__main__":
    main()
