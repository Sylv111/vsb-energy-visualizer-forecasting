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
from tensorflow.keras.layers import ConvLSTM2D, Dense, Flatten, Reshape, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import Callback
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error

warnings.filterwarnings("ignore", category=UserWarning)
tf.get_logger().setLevel('ERROR')


class ProgressCallback(Callback):
    """Callback to display training progress percentage."""
    
    def __init__(self, total_epochs):
        super().__init__()
        self.total_epochs = total_epochs
    
    def on_epoch_end(self, epoch, logs=None):
        """Called at the end of each epoch."""
        progress = int(((epoch + 1) / self.total_epochs) * 100)
        print(f"PROGRESS: {progress}% (Epoch {epoch + 1}/{self.total_epochs})", file=sys.stderr)


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    p = argparse.ArgumentParser(description="Time series prediction with ConvLSTM.")
    
    # Required arguments
    p.add_argument("--file", required=True, help="Path to input CSV file")
    p.add_argument("--x", dest="col_x", required=True, help="Name of target column to predict")
    p.add_argument("--y", dest="col_y", required=True, help="Name of increment/index column")
    p.add_argument("--n", dest="n_pred", type=int, required=True, help="Number of points to predict")
    p.add_argument("--start_index", type=int, default=-1, help="Starting index for prediction (default: -1 for end of data)")
    
    # Advanced parameters
    p.add_argument("--epochs", type=int, default=200, help="Number of training epochs (default: 200)")
    p.add_argument("--batch_size", type=int, default=32, help="Batch size for training (default: 32)")
    p.add_argument("--learning_rate", type=float, default=0.001, help="Learning rate (default: 0.001)")
    p.add_argument("--seq_length", type=int, default=48, help="Sequence length for ConvLSTM (default: 48)")
    p.add_argument("--filters", type=int, default=64, help="Number of filters in ConvLSTM (default: 64)")
    p.add_argument("--kernel_size", type=int, default=3, help="Kernel size for ConvLSTM (default: 3)")
    p.add_argument("--dropout", type=float, default=0.2, help="Dropout rate (default: 0.2)")
    p.add_argument("--l2_reg", type=float, default=0.001, help="L2 regularization (default: 0.001)")
    p.add_argument("--verbose", type=int, default=1, help="Verbosity level (0=silent, 1=progress, 2=one line per epoch)")
    
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


def build_convlstm_model(seq_length: int, n_features: int = 1, 
                        filters: int = 64, kernel_size: int = 3,
                        dropout: float = 0.2, l2_reg: float = 0.001,
                        learning_rate: float = 0.001) -> tf.keras.Model:
    """Build ConvLSTM model for time series prediction."""
    from tensorflow.keras.regularizers import l2
    
    model = Sequential([
        # Reshape for ConvLSTM2D (samples, time, rows, cols, channels)
        Reshape((seq_length, 1, 1, n_features), input_shape=(seq_length, n_features)),
        
        # ConvLSTM2D layer with configurable parameters
        ConvLSTM2D(filters=filters, kernel_size=(1, 1), padding='same', 
                  return_sequences=False, activation='tanh',
                  kernel_regularizer=l2(l2_reg)),
        
        # Flatten and dense layers with dropout and regularization
        Flatten(),
        Dense(50, activation='relu', kernel_regularizer=l2(l2_reg)),
        Dropout(dropout),
        Dense(25, activation='relu', kernel_regularizer=l2(l2_reg)),
        Dropout(dropout),
        Dense(1, activation='linear')
    ])
    
    model.compile(optimizer=Adam(learning_rate=learning_rate), 
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
    
    # Prepare data - X is the target to predict, Y is the increment column
    try:
        target_data = pd.to_numeric(df[args.col_x], errors="coerce")  # Column to predict
        increment_data = pd.to_numeric(df[args.col_y], errors="coerce")  # Increment column
    except Exception as e:
        print(f"ERROR: Cannot parse columns as numeric: {e}", file=sys.stderr)
        sys.exit(3)
    
    # Handle missing values for target data
    target_data = target_data.fillna(method='ffill').fillna(method='bfill')
    
    # Determine starting point for prediction
    start_index = args.start_index
    if start_index == -1:
        start_index = len(target_data) - 1  # Use last point by default
    elif start_index < 0 or start_index >= len(target_data):
        print(f"ERROR: Invalid start_index {start_index}. Must be between 0 and {len(target_data)-1}", file=sys.stderr)
        sys.exit(3)
    
    print(f"INFO: Starting prediction from index {start_index} (value: {target_data.iloc[start_index]})", file=sys.stderr)
    
    # Detect precision
    target_precision = detect_precision(target_data.values)
    increment_precision = detect_precision(increment_data.values)
    print(f"INFO: Detected precision - Target: {target_precision} decimals, Increment: {increment_precision} decimals", file=sys.stderr)
    
    # Use provided sequence length or calculate default
    seq_length = args.seq_length
    if seq_length > len(target_data) // 2:
        seq_length = len(target_data) // 2
    if seq_length < 5:
        seq_length = 5
    
    print(f"INFO: Using sequence length: {seq_length}", file=sys.stderr)
    
    try:
        X, y, scaler = prepare_data_for_convlstm(target_data.values, seq_length)
        # Get scaled data for predictions
        target_scaled = scaler.transform(target_data.values.reshape(-1, 1)).flatten()
        print(f"INFO: Created {len(X)} training sequences", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: Failed to prepare data: {e}", file=sys.stderr)
        sys.exit(4)
    
    # Build and train model with configurable parameters
    model = build_convlstm_model(
        seq_length=seq_length,
        filters=args.filters,
        kernel_size=args.kernel_size,
        dropout=args.dropout,
        l2_reg=args.l2_reg,
        learning_rate=args.learning_rate
    )
    print(f"INFO: Built ConvLSTM model with filters={args.filters}, kernel_size={args.kernel_size}, dropout={args.dropout}", file=sys.stderr)
    
    # Train model with configurable parameters
    try:
        # Create progress callback
        progress_callback = ProgressCallback(args.epochs)
        
        history = model.fit(X, y, epochs=args.epochs, batch_size=args.batch_size, 
                           validation_split=0.2, verbose=args.verbose, 
                           callbacks=[progress_callback])
        
        # Calculate and display metrics
        final_loss = history.history['loss'][-1]
        final_val_loss = history.history['val_loss'][-1]
        final_mae = history.history['mae'][-1]
        final_val_mae = history.history['val_mae'][-1]
        
        # Calculate percentage metrics on original data scale
        target_mean = np.mean(target_data.values)
        target_std = np.std(target_data.values)
        target_range = np.max(target_data.values) - np.min(target_data.values)
        
        # Convert normalized metrics back to original scale
        mae_orig_train = final_mae * target_range
        mae_orig_val = final_val_mae * target_range
        rmse_orig_train = np.sqrt(final_loss) * target_range
        rmse_orig_val = np.sqrt(final_val_loss) * target_range
        
        # MAE as percentage of mean
        mae_pct_train = (mae_orig_train / target_mean) * 100
        mae_pct_val = (mae_orig_val / target_mean) * 100
        
        # RMSE as percentage of mean
        rmse_pct_train = (rmse_orig_train / target_mean) * 100
        rmse_pct_val = (rmse_orig_val / target_mean) * 100
        
        print(f"INFO: Model trained successfully", file=sys.stderr)
        print(f"INFO: Data statistics - Mean: {target_mean:.2f}, Std: {target_std:.2f}", file=sys.stderr)
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
        # Use data from the specified starting point for prediction
        if start_index >= seq_length:
            # Use sequence ending at start_index
            sequence_start = start_index - seq_length + 1
            last_sequence = target_scaled[sequence_start:start_index + 1]
        else:
            # If start_index is too early, use the beginning of the data
            last_sequence = target_scaled[:seq_length]
            print(f"WARNING: start_index {start_index} is too early for sequence length {seq_length}, using beginning of data", file=sys.stderr)
        
        predictions = predict_future_convlstm(model, last_sequence, args.n_pred, scaler)
        
        # Round predictions to match original precision
        predictions = [round_to_precision(pred, target_precision) for pred in predictions]
        
        print(f"INFO: Generated {len(predictions)} predictions starting from index {start_index}", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: Prediction generation failed: {e}", file=sys.stderr)
        sys.exit(6)
    
    # Generate future increment values starting from the specified point
    increment_values = increment_data.values
    # Use the increment value at the starting point
    start_increment = float(increment_values[start_index])
    
    future_increment = []
    for i in range(args.n_pred):
        increment_val = start_increment + (i + 1)  # Simple +1 increment from starting point
        future_increment.append(round_to_precision(increment_val, increment_precision))
    
    # Check if input file is already a prediction file
    input_filename = os.path.basename(args.file)
    
    if input_filename.startswith("AI prediction - "):
        # Input file is already a prediction file, use it directly
        result_df = df.copy()
        output_file = args.file
        print(f"INFO: Using existing prediction file as input and output", file=sys.stderr)
    else:
        # Input file is original data, check if prediction file exists
        base_name, ext = os.path.splitext(input_filename)
        prediction_file = os.path.join(os.path.dirname(args.file), f"AI prediction - {base_name}{ext}")
        
        if os.path.exists(prediction_file):
            # Load existing prediction file
            result_df = pd.read_csv(prediction_file)
            print(f"INFO: Loaded existing prediction file with {len(result_df.columns)} columns", file=sys.stderr)
            output_file = prediction_file
        else:
            # Create new DataFrame with original data
            result_df = df.copy()
            print(f"INFO: Created new prediction file from original data", file=sys.stderr)
            output_file = prediction_file
    
    # Create prediction column name with AI indicator and increment if needed
    base_prediction_name = f"{args.col_x}_AI_Prediction"
    prediction_col_name = base_prediction_name
    
    # Check if column already exists and find next available name
    counter = 1
    while prediction_col_name in result_df.columns:
        counter += 1
        prediction_col_name = f"{base_prediction_name}_{counter}"
    
    # Initialize prediction column with NaN values (better for visualization)
    result_df[prediction_col_name] = np.nan
    
    # Add predictions starting from the specified index
    for i, pred_value in enumerate(predictions):
        # Round prediction to match input precision
        rounded_pred = round_to_precision(pred_value, target_precision)
        
        pred_index = start_index + i + 1
        if pred_index < len(result_df):
            # If we're within existing data, add the prediction
            result_df.loc[pred_index, prediction_col_name] = rounded_pred
        else:
            # If we're beyond existing data, add new rows
            new_row = pd.Series([""] * len(result_df.columns), index=result_df.columns)
            new_row[args.col_y] = start_increment + i + 1  # Increment column
            new_row[prediction_col_name] = rounded_pred
            result_df = pd.concat([result_df, new_row.to_frame().T], ignore_index=True)
    
    # Save file with original data + predictions
    try:
        result_df.to_csv(output_file, index=False)
        print(f"INFO: Saved predictions to: {output_file}")
        print(f"INFO: Model: ConvLSTM with sequence length {seq_length}")
        print(f"INFO: Final Training - MAE: {mae_pct_train:.2f}%, RMSE: {rmse_pct_train:.2f}%")
        print(f"INFO: Final Validation - MAE: {mae_pct_val:.2f}%, RMSE: {rmse_pct_val:.2f}%")
        print(f"INFO: Precision preserved: {target_precision} decimal places for target, {increment_precision} decimal places for increment")
        print(f"INFO: Added prediction column '{prediction_col_name}' with {args.n_pred} predictions")
    except Exception as e:
        print(f"ERROR: Cannot save output file: {e}", file=sys.stderr)
        sys.exit(7)


if __name__ == "__main__":
    main()
