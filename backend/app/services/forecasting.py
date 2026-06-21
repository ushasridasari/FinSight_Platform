"""
AI-powered price forecasting using Anthropic Claude.
Claude analyzes historical OHLCV data and returns a structured price forecast
with trend direction, target price, and confidence bounds.
"""
import json
from datetime import datetime, timedelta
from typing import List, Tuple

import anthropic
import pandas as pd

from ..core.config import settings
from ..schemas.market import ForecastResponse, ForecastPoint, OHLCV
from .market_data import get_ohlcv_dataframe, get_ohlcv


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _ai_available() -> bool:
    key = settings.anthropic_api_key
    return bool(key) and not key.startswith("your_") and key.startswith("sk-")


def _build_price_summary(df: pd.DataFrame) -> Tuple[str, float, float, float]:
    recent = df.tail(60)
    csv_lines = ["Date,Close,Volume"]
    for date, row in recent.iterrows():
        csv_lines.append(f"{str(date.date())},{row['Close']:.2f},{int(row['Volume'])}")

    first_price = float(df["Close"].iloc[0])
    last_price  = float(df["Close"].iloc[-1])
    high        = float(df["High"].max())
    low         = float(df["Low"].min())
    avg_vol     = int(df["Volume"].mean())
    move_pct    = (last_price - first_price) / first_price * 100

    summary = (
        f"Period: {str(df.index[0].date())} to {str(df.index[-1].date())}\n"
        f"Current price: ${last_price:.2f}\n"
        f"Period high: ${high:.2f} | Period low: ${low:.2f}\n"
        f"Price change over full period: {move_pct:+.2f}%\n"
        f"Average daily volume: {avg_vol:,}\n\n"
        f"Recent 60-day close prices (CSV):\n"
        + "\n".join(csv_lines)
    )
    return summary, last_price, high, low


def _generate_forecast_points(
    current_price: float,
    target_price: float,
    confidence: int,
    horizon_days: int,
    last_date: datetime,
) -> List[ForecastPoint]:
    """
    Linear interpolation from current price to Claude's target.
    Uncertainty bands expand as sqrt(time) to mimic volatility scaling.
    """
    base_spread = current_price * (1 - confidence / 100) * 0.6
    points = []
    for day in range(1, horizon_days + 1):
        t = day / horizon_days
        predicted = current_price + (target_price - current_price) * t
        spread    = base_spread * (t ** 0.5)
        forecast_date = last_date + timedelta(days=day)
        points.append(ForecastPoint(
            date=forecast_date.strftime("%Y-%m-%d"),
            predicted=round(predicted, 2),
            lower_bound=round(predicted - spread, 2),
            upper_bound=round(predicted + spread, 2),
        ))
    return points


def get_forecast(ticker: str, horizon: int = 30) -> ForecastResponse:
    ticker = ticker.upper()
    df = get_ohlcv_dataframe(ticker, period="1y")
    if df.empty:
        raise ValueError(f"No historical data available for {ticker}")

    historical = get_ohlcv(ticker, period="6mo")
    last_date  = df.index[-1].to_pydatetime()
    current_price = float(df["Close"].iloc[-1])

    if not _ai_available():
        forecast_pts = _generate_forecast_points(current_price, current_price, 50, horizon, last_date)
        return ForecastResponse(
            ticker=ticker,
            horizon_days=horizon,
            model="AI (key not configured — set ANTHROPIC_API_KEY)",
            historical=historical,
            forecast=forecast_pts,
            metrics={},
            ai_commentary={
                "commentary": "Set ANTHROPIC_API_KEY in backend/.env to enable AI forecasting.",
                "confidence": 0,
                "trend": "Unknown",
                "key_levels": [],
                "catalysts": [],
                "expected_move_pct": 0.0,
            },
        )

    price_summary, current_price, high, low = _build_price_summary(df)

    prompt = f"""You are a professional quantitative analyst. Study the historical price data for {ticker} below and generate a {horizon}-day price forecast.

{price_summary}

Respond ONLY with raw JSON — no markdown, no text outside the JSON object:
{{
  "target_price": <float: your predicted price {horizon} days from now>,
  "trend": "<Bullish | Bearish | Neutral>",
  "confidence": <integer 0-100: your confidence in this forecast>,
  "commentary": "<2-3 sentences: interpretation of price action and forecast rationale>",
  "key_levels": [
    {{"type": "support", "price": <float>}},
    {{"type": "resistance", "price": <float>}}
  ],
  "catalysts": ["<upside catalyst>", "<downside risk>"],
  "expected_move_pct": <float: % change from current ${current_price:.2f} to your target>
}}"""

    try:
        msg  = _client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(msg.content[0].text.strip())
    except Exception:
        data = {
            "target_price": current_price,
            "trend": "Neutral",
            "confidence": 50,
            "commentary": "AI analysis temporarily unavailable.",
            "key_levels": [],
            "catalysts": [],
            "expected_move_pct": 0.0,
        }

    target_price = float(data.get("target_price", current_price))
    confidence   = int(data.get("confidence", 50))
    move_pct     = (target_price - current_price) / current_price * 100

    forecast_pts = _generate_forecast_points(current_price, target_price, confidence, horizon, last_date)

    return ForecastResponse(
        ticker=ticker,
        horizon_days=horizon,
        model="Claude AI (claude-sonnet-4-6)",
        historical=historical,
        forecast=forecast_pts,
        metrics={
            "current_price":     round(current_price, 2),
            "target_price":      round(target_price, 2),
            "expected_move_pct": round(move_pct, 2),
            "confidence":        confidence,
            "trend":             data.get("trend", "Neutral"),
        },
        ai_commentary={
            "commentary":        data.get("commentary", ""),
            "confidence":        confidence,
            "trend":             data.get("trend", "Neutral"),
            "key_levels":        data.get("key_levels", []),
            "catalysts":         data.get("catalysts", []),
            "expected_move_pct": round(move_pct, 2),
        },
    )
