#!/usr/bin/env python3
"""
forecast_ridge.py
-----------------
Simple time-series extrapolation using Ridge regression with lag features.

Usage:
  python forecast_ridge.py --file chemin.csv --x X_COL --y Y_COL --n 50
Optional:
  --lags 24                 # number of lag features (default: 24)
  --out out.csv             # output file path (default: <input>_with_preds.csv)
  --alpha "0.1,1,10,100"    # RidgeCV alpha grid (comma-separated)
  --dropna                  # drop rows where Y is NaN (default: keep and forward-fill Y)
  --no-sort                 # do not sort by X column (default: sort ascending)
Notes:
- Appends n predicted rows to the CSV.
- Predicted values are written into the Y column.
- Any other columns are left empty (NaN) for the appended rows.
"""

import argparse
import os
import sys
import warnings
from typing import List

import numpy as np
import pandas as pd

from sklearn.linear_model import RidgeCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore", category=UserWarning)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Extrapolate a time series with Ridge (lag features).")
    p.add_argument("--file", required=True, help="Path to input CSV file")
    p.add_argument("--x", dest="col_x", required=True, help="Name of increment/index column (must be numeric or parseable as numeric)")
    p.add_argument("--y", dest="col_y", required=True, help="Name of target column to predict/extend")
    p.add_argument("--n", dest="n_pred", type=int, required=True, help="Number of points to predict/append")
    p.add_argument("--lags", dest="lags", type=int, default=24, help="Number of lag features to use (default: 24)")
    p.add_argument("--out", dest="out_path", default=None, help="Output CSV path (default: <input>_with_preds.csv)")
    p.add_argument("--alpha", dest="alpha_grid", default="0.1,0.3,1,3,10,30,100", help="Comma-separated RidgeCV alphas")
    p.add_argument("--dropna", action="store_true", help="Drop rows where Y is NaN (default: forward-fill Y)")
    p.add_argument("--no-sort", action="store_true", help="Do not sort by X (default: sort ascending)")
    return p.parse_args()


def make_lag_matrix(y: np.ndarray, lags: int) -> (np.ndarray, np.ndarray):
    """
    Given a 1D array y, build a supervised dataset:
    X[t] = [y[t-1], y[t-2], ..., y[t-lags]]
    y_target[t] = y[t]
    for t = lags .. len(y)-1
    """
    if lags < 1:
        raise ValueError("lags must be >= 1")
    n = len(y)
    if n <= lags:
        raise ValueError(f"Not enough data points ({n}) for lags={lags}. Reduce --lags.")
    X = np.column_stack([y[i: n - lags + i] for i in range(lags)][::-1])
    # Explanation:
    # For lags=3, we want columns [y[t-1], y[t-2], y[t-3]] aligned to predict y[t].
    # The stacking above creates shape (n-lags, lags) with the desired alignment.
    y_target = y[lags:]
    return X, y_target


def infer_step(x: np.ndarray) -> float:
    """Infer index step as the median difference (robust to minor anomalies)."""
    diffs = np.diff(x.astype(float))
    # Filter out NaNs or infs just in case
    diffs = diffs[np.isfinite(diffs)]
    if diffs.size == 0:
        return 1.0
    step = float(np.median(diffs))
    if step == 0:
        step = 1.0
    return step


def detect_precision(y: np.ndarray) -> int:
    """
    Detect the precision (number of decimal places) of the input data.
    Returns the number of decimal places to preserve in predictions.
    """
    # Convert to string to analyze decimal places
    y_clean = y[~np.isnan(y)]
    if len(y_clean) == 0:
        return 0
    
    # Sample a subset for efficiency
    sample_size = min(100, len(y_clean))
    sample_indices = np.random.choice(len(y_clean), sample_size, replace=False)
    sample_values = y_clean[sample_indices]
    
    max_decimals = 0
    for val in sample_values:
        # Convert to string and check decimal places
        val_str = f"{val:.10f}".rstrip('0').rstrip('.')
        if '.' in val_str:
            decimals = len(val_str.split('.')[1])
            max_decimals = max(max_decimals, decimals)
    
    return max_decimals


def round_to_precision(value: float, precision: int) -> float:
    """Round value to the specified number of decimal places."""
    if precision == 0:
        return round(value)
    else:
        return round(value, precision)


def main():
    args = parse_args()

    # Read CSV
    try:
        df = pd.read_csv(args.file)
    except Exception as e:
        print(f"ERROR: cannot read CSV: {e}", file=sys.stderr)
        sys.exit(1)

    if args.col_x not in df.columns or args.col_y not in df.columns:
        print(f"ERROR: columns not found. Got columns: {list(df.columns)}", file=sys.stderr)
        sys.exit(2)

    # Ensure X is numeric
    try:
        x = pd.to_numeric(df[args.col_x], errors="coerce")
    except Exception as e:
        print(f"ERROR: cannot parse X column '{args.col_x}' as numeric: {e}", file=sys.stderr)
        sys.exit(3)

    # Prepare target series y
    y_series = pd.to_numeric(df[args.col_y], errors="coerce")

    # Handle sorting
    if not args.no_sort:
        # sort by X while keeping row alignment
        order = np.argsort(x.values)
        df = df.iloc[order].reset_index(drop=True)
        x = pd.to_numeric(df[args.col_x], errors="coerce")
        y_series = pd.to_numeric(df[args.col_y], errors="coerce")

    # Handle missing targets
    if args.dropna:
        mask = y_series.notna()
        x = x[mask].reset_index(drop=True)
        y_series = y_series[mask].reset_index(drop=True)
    else:
        # forward-fill then back-fill as a last resort
        y_series = y_series.ffill().bfill()

    y = y_series.to_numpy(dtype=float)

    # Detect precision of input data
    precision = detect_precision(y)
    print(f"INFO: detected precision: {precision} decimal places", file=sys.stderr)

    # Auto-adjust lags if needed
    lags = int(args.lags)
    if len(y) <= lags:
        lags = max(1, len(y) - 1)
        print(f"INFO: reduced lags to {lags} due to short series.", file=sys.stderr)

    # Build supervised dataset
    try:
        X_mat, y_target = make_lag_matrix(y, lags)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(4)

    # RidgeCV pipeline with standardization
    alphas: List[float] = [float(a) for a in str(args.alpha_grid).split(",") if str(a).strip()]
    model = Pipeline([
        ("scaler", StandardScaler(with_mean=True, with_std=True)),
        ("ridge", RidgeCV(alphas=alphas, fit_intercept=True, store_cv_values=False))
    ])

    # Fit on available data
    model.fit(X_mat, y_target)

    # Recursive forecasting of n future points
    y_hist = y.copy().tolist()
    preds = []
    for _ in range(args.n_pred):
        last_window = np.array(y_hist[-lags:], dtype=float).reshape(1, -1)
        y_next = float(model.predict(last_window)[0])
        # Round to match input precision
        y_next_rounded = round_to_precision(y_next, precision)
        preds.append(y_next_rounded)
        y_hist.append(y_next_rounded)

    # Build appended frame
    # Infer step for X and generate future X values
    x_np = x.to_numpy(dtype=float)
    step = infer_step(x_np)
    last_x = float(x_np[~np.isnan(x_np)][-1])
    
    # Detect precision for X values
    x_precision = detect_precision(x_np)
    future_x = []
    for i in range(args.n_pred):
        x_val = last_x + step * (i + 1)
        future_x.append(round_to_precision(x_val, x_precision))

    # Create a DataFrame with NaNs for non-target columns
    future_rows = pd.DataFrame({col: [np.nan] * args.n_pred for col in df.columns})

    # Set X and Y for future rows
    if args.col_x in future_rows.columns:
        future_rows[args.col_x] = future_x
    future_rows[args.col_y] = preds

    # Concatenate original + future
    out_df = pd.concat([df, future_rows], ignore_index=True)

    # Output path
    if args.out_path is None:
        base, ext = os.path.splitext(args.file)
        out_path = f"{base}_with_preds{ext or '.csv'}"
    else:
        out_path = args.out_path

    # Save
    try:
        out_df.to_csv(out_path, index=False)
    except Exception as e:
        print(f"ERROR: cannot write output CSV: {e}", file=sys.stderr)
        sys.exit(5)

    # Small summary to STDOUT
    print(f"Saved predictions to: {out_path}")
    print(f"Model: RidgeCV (alphas={alphas}) with {lags} lags")
    if hasattr(model.named_steps["ridge"], "alpha_"):
        print(f"Chosen alpha: {model.named_steps['ridge'].alpha_}")
    print(f"Index step inferred: {step}")
    print(f"Precision preserved: {precision} decimal places for Y, {x_precision} decimal places for X")
    print(f"Appended {args.n_pred} rows.")

if __name__ == "__main__":
    main()
