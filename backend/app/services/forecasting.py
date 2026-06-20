"""
Time-series forecasting service.
Uses Facebook Prophet for price prediction with uncertainty intervals.
Falls back to a simple linear regression when Prophet is unavailable.
"""
import pandas as pd
import numpy as np
from typing import List, Tuple
from datetime import timedelta

from ..schemas.market import ForecastPoint, ForecastResponse, OHLCV
from .market_data import get_ohlcv_dataframe, get_ohlcv


def _compute_forecast_metrics(actual: pd.Series, predicted: pd.Series) -> dict:
    """MAPE and RMSE on the last in-sample overlap."""
    n = min(len(actual), len(predicted), 30)
    if n == 0:
        return {"mape": None, "rmse": None}
    a = actual.values[-n:]
    p = predicted.values[:n]
    mape = float(np.mean(np.abs((a - p) / (a + 1e-9))) * 100)
    rmse = float(np.sqrt(np.mean((a - p) ** 2)))
    return {"mape": round(mape, 2), "rmse": round(rmse, 4)}


def forecast_with_prophet(ticker: str, horizon_days: int = 30) -> ForecastResponse:
    try:
        from prophet import Prophet
    except ImportError:
        return forecast_with_linear(ticker, horizon_days)

    df = get_ohlcv_dataframe(ticker, period="2y")
    if df.empty or len(df) < 60:
        raise ValueError(f"Insufficient historical data for {ticker}")

    prophet_df = df[["Close"]].reset_index().rename(columns={"Date": "ds", "Close": "y"})
    prophet_df["ds"] = pd.to_datetime(prophet_df["ds"]).dt.tz_localize(None)

    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=True,
        changepoint_prior_scale=0.05,
        interval_width=0.80,
    )
    model.fit(prophet_df)

    future = model.make_future_dataframe(periods=horizon_days, freq="B")  # business days
    forecast_df = model.predict(future)

    # Separate historical fit from forward forecast
    last_hist_date = prophet_df["ds"].max()
    fwd = forecast_df[forecast_df["ds"] > last_hist_date].tail(horizon_days)

    forecast_points: List[ForecastPoint] = []
    for _, row in fwd.iterrows():
        forecast_points.append(ForecastPoint(
            date=str(row["ds"].date()),
            predicted=round(float(row["yhat"]), 4),
            lower_bound=round(float(row["yhat_lower"]), 4),
            upper_bound=round(float(row["yhat_upper"]), 4),
        ))

    in_sample = forecast_df[forecast_df["ds"] <= last_hist_date]
    metrics = _compute_forecast_metrics(
        prophet_df["y"],
        in_sample["yhat"],
    )
    metrics["model"] = "Prophet"

    historical = get_ohlcv(ticker, period="6mo")

    return ForecastResponse(
        ticker=ticker.upper(),
        horizon_days=horizon_days,
        model="Prophet",
        historical=historical,
        forecast=forecast_points,
        metrics=metrics,
    )


def forecast_with_linear(ticker: str, horizon_days: int = 30) -> ForecastResponse:
    """
    Fallback: polynomial regression on closing price with rolling volatility
    used to build confidence bounds.
    """
    from sklearn.preprocessing import PolynomialFeatures
    from sklearn.linear_model import Ridge
    from sklearn.pipeline import Pipeline

    df = get_ohlcv_dataframe(ticker, period="1y")
    if df.empty:
        raise ValueError(f"No data for {ticker}")

    closes = df["Close"].values.flatten()
    x = np.arange(len(closes)).reshape(-1, 1)

    pipe = Pipeline([
        ("poly", PolynomialFeatures(degree=3)),
        ("ridge", Ridge(alpha=1.0)),
    ])
    pipe.fit(x, closes)

    rolling_std = float(np.std(np.diff(closes) / closes[:-1]))

    forecast_points: List[ForecastPoint] = []
    for i in range(1, horizon_days + 1):
        xi = np.array([[len(closes) + i]])
        pred = float(pipe.predict(xi)[0])
        band = pred * rolling_std * np.sqrt(i)
        dt = (df.index[-1] + timedelta(days=i)).date()
        forecast_points.append(ForecastPoint(
            date=str(dt),
            predicted=round(pred, 4),
            lower_bound=round(max(pred - 2 * band, 0), 4),
            upper_bound=round(pred + 2 * band, 4),
        ))

    historical = get_ohlcv(ticker, period="6mo")
    return ForecastResponse(
        ticker=ticker.upper(),
        horizon_days=horizon_days,
        model="PolynomialRegression",
        historical=historical,
        forecast=forecast_points,
        metrics={"model": "PolynomialRegression", "note": "fallback — Prophet not available"},
    )


def get_forecast(ticker: str, horizon_days: int = 30) -> ForecastResponse:
    """Entry point — tries Prophet first, falls back gracefully."""
    try:
        return forecast_with_prophet(ticker, horizon_days)
    except Exception:
        return forecast_with_linear(ticker, horizon_days)
