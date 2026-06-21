"""
Backtesting engine.
Supports five strategies:
  1. SMA Crossover  — golden/death cross on two moving averages
  2. RSI            — oversold/overbought mean-reversion
  3. Bollinger Bands — price touches lower/upper band
  4. MACD           — signal line crossover
  5. AI Signal      — Claude AI reads price windows and decides buy/sell

Each strategy returns a BacktestResponse with full trade log,
equity curve (strategy vs buy-and-hold), and performance metrics.
"""
import json
import numpy as np
import pandas as pd
from typing import List, Tuple
import anthropic

from ..core.config import settings
from ..schemas.analytics import (
    BacktestRequest, BacktestResponse, BacktestMetrics, Trade, EquityPoint,
)
from .market_data import get_ohlcv_dataframe


def _ai_available() -> bool:
    key = settings.anthropic_api_key
    return bool(key) and not key.startswith("your_") and key.startswith("sk-")


def _ai_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _signals_ai(df: pd.DataFrame) -> pd.Series:
    """
    Ask Claude to identify buy/sell dates from the full price history.
    Returns a Series of 1 (buy), -1 (sell), 0 (hold) indexed by date.
    """
    if not _ai_available():
        return pd.Series(0, index=df.index)

    # Condense to monthly snapshots to keep the prompt concise
    monthly = df["Close"].resample("ME").last()
    price_lines = "\n".join(f"{str(d.date())}: ${p:.2f}" for d, p in monthly.items())

    prompt = f"""You are a quantitative trading analyst. Based on the monthly price history below, identify the best buy and sell dates for a swing trading strategy.

Price history (monthly close):
{price_lines}

Rules:
- Alternate strictly: first BUY, then SELL, then BUY again, etc.
- Choose dates that appear in the price history above only.
- Aim for 4-10 round-trip trades across the full period.

Respond ONLY with a raw JSON array (no markdown):
[
  {{"date": "YYYY-MM-DD", "action": "BUY"}},
  {{"date": "YYYY-MM-DD", "action": "SELL"}},
  ...
]"""

    try:
        msg  = _ai_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        trades_raw = json.loads(msg.content[0].text.strip())
    except Exception:
        return pd.Series(0, index=df.index)

    # Map Claude's dates to daily signals
    signal = pd.Series(0, index=df.index)
    for entry in trades_raw:
        try:
            date_str = entry["date"]
            action   = entry["action"].upper()
            # Find nearest trading day on or after the given date
            target = pd.Timestamp(date_str)
            match  = df.index[df.index >= target]
            if len(match) > 0:
                signal.loc[match[0]] = 1 if action == "BUY" else -1
        except Exception:
            continue

    return signal

TRADING_DAYS = 252


# ── Technical indicator helpers ───────────────────────────────────────────────

def _sma(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window).mean()


def _ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def _rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / (loss + 1e-9)
    return 100 - (100 / (1 + rs))


def _bollinger(series: pd.Series, window: int = 20, num_std: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series]:
    mid = _sma(series, window)
    std = series.rolling(window).std()
    return mid - num_std * std, mid, mid + num_std * std


def _macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    macd_line = _ema(series, fast) - _ema(series, slow)
    signal_line = _ema(macd_line, signal)
    return macd_line, signal_line


# ── Signal generators — return pd.Series of 1 (buy) / -1 (sell) / 0 (hold) ──

def _signals_sma(df: pd.DataFrame, short: int, long: int) -> pd.Series:
    fast = _sma(df["Close"], short)
    slow = _sma(df["Close"], long)
    signal = pd.Series(0, index=df.index)
    signal[fast > slow] = 1
    signal[fast <= slow] = -1
    return signal


def _signals_rsi(df: pd.DataFrame, period: int, oversold: float, overbought: float) -> pd.Series:
    rsi = _rsi(df["Close"], period)
    signal = pd.Series(0, index=df.index)
    signal[rsi < oversold] = 1
    signal[rsi > overbought] = -1
    return signal


def _signals_bollinger(df: pd.DataFrame, window: int) -> pd.Series:
    lower, _, upper = _bollinger(df["Close"], window)
    signal = pd.Series(0, index=df.index)
    signal[df["Close"] < lower] = 1
    signal[df["Close"] > upper] = -1
    return signal


def _signals_macd(df: pd.DataFrame, fast: int, slow: int, sig: int) -> pd.Series:
    macd, signal_line = _macd(df["Close"], fast, slow, sig)
    signal = pd.Series(0, index=df.index)
    signal[macd > signal_line] = 1
    signal[macd <= signal_line] = -1
    return signal


# ── Core simulation ───────────────────────────────────────────────────────────

def _simulate(df: pd.DataFrame, signals: pd.Series, initial_capital: float):
    """
    Walk forward through signals, executing one trade per signal flip.
    Returns (trades, equity_curve, final_value).
    """
    cash = initial_capital
    shares = 0.0
    position = 0       # 1 = long, 0 = flat
    prev_signal = 0

    trades: List[Trade] = []
    equity: List[dict] = []

    buyhold_shares = initial_capital / df["Close"].iloc[0]

    for date, row in df.iterrows():
        price = float(row["Close"])
        sig = int(signals.loc[date])
        port_val = cash + shares * price

        if sig == 1 and prev_signal != 1 and cash > 0:
            # Enter long
            shares = cash / price
            cash = 0.0
            position = 1
            trades.append(Trade(
                date=str(date.date()),
                action="BUY",
                price=round(price, 4),
                shares=round(shares, 4),
                portfolio_value=round(port_val, 2),
            ))

        elif sig == -1 and position == 1:
            # Exit long
            proceeds = shares * price
            pnl = proceeds - (shares * float(trades[-1].price)) if trades else 0
            trades.append(Trade(
                date=str(date.date()),
                action="SELL",
                price=round(price, 4),
                shares=round(shares, 4),
                portfolio_value=round(proceeds, 2),
                pnl=round(pnl, 2),
            ))
            cash = proceeds
            shares = 0.0
            position = 0

        prev_signal = sig
        equity.append({
            "date": str(date.date()),
            "strategy_value": round(cash + shares * price, 2),
            "buyhold_value": round(buyhold_shares * price, 2),
        })

    # Close any open position at last price
    if position == 1:
        last_price = float(df["Close"].iloc[-1])
        cash = shares * last_price
        shares = 0.0

    final_value = cash
    return trades, equity, final_value


def _compute_metrics(
    initial_capital: float,
    final_value: float,
    equity_curve: list,
    trades: List[Trade],
    buyhold_final: float,
    period_years: float,
) -> BacktestMetrics:
    strat_values = [e["strategy_value"] for e in equity_curve]
    returns = pd.Series(strat_values).pct_change().dropna()

    total_return = (final_value - initial_capital) / initial_capital * 100
    bh_return    = (buyhold_final - initial_capital) / initial_capital * 100

    ann_return = ((final_value / initial_capital) ** (1 / max(period_years, 0.1)) - 1) * 100
    ann_vol    = float(returns.std() * np.sqrt(TRADING_DAYS) * 100)
    sharpe     = (ann_return / 100 - 0.05) / (ann_vol / 100 + 1e-9)

    # Max drawdown
    arr = np.array(strat_values)
    peak = np.maximum.accumulate(arr)
    dd   = (arr - peak) / (peak + 1e-9)
    max_dd = float(np.min(dd) * 100)

    sell_trades = [t for t in trades if t.action == "SELL" and t.pnl is not None]
    profitable  = [t for t in sell_trades if (t.pnl or 0) > 0]
    win_rate    = len(profitable) / len(sell_trades) * 100 if sell_trades else 0.0
    avg_pnl     = float(np.mean([t.pnl for t in sell_trades])) if sell_trades else 0.0

    return BacktestMetrics(
        total_return_pct=round(total_return, 2),
        buyhold_return_pct=round(bh_return, 2),
        annualized_return=round(ann_return, 2),
        annualized_volatility=round(ann_vol, 2),
        sharpe_ratio=round(sharpe, 4),
        max_drawdown=round(max_dd, 2),
        win_rate=round(win_rate, 2),
        total_trades=len(sell_trades),
        profitable_trades=len(profitable),
        avg_trade_pnl=round(avg_pnl, 2),
    )


# ── Public entry point ────────────────────────────────────────────────────────

def run_backtest(req: BacktestRequest) -> BacktestResponse:
    df = get_ohlcv_dataframe(req.ticker, period=req.period)
    if df.empty or len(df) < max(req.long_window, req.rsi_period, req.macd_slow) + 10:
        raise ValueError(f"Insufficient data for {req.ticker} with period {req.period}")

    strategy = req.strategy.lower()
    if strategy == "sma_crossover":
        signals = _signals_sma(df, req.short_window, req.long_window)
    elif strategy == "rsi":
        signals = _signals_rsi(df, req.rsi_period, req.rsi_oversold, req.rsi_overbought)
    elif strategy == "bollinger":
        signals = _signals_bollinger(df, req.short_window)
    elif strategy == "macd":
        signals = _signals_macd(df, req.macd_fast, req.macd_slow, req.macd_signal)
    elif strategy == "ai_signal":
        signals = _signals_ai(df)
    else:
        raise ValueError(f"Unknown strategy: {req.strategy}")

    trades, equity_curve, final_value = _simulate(df, signals, req.initial_capital)

    period_years = len(df) / TRADING_DAYS
    buyhold_final = req.initial_capital / float(df["Close"].iloc[0]) * float(df["Close"].iloc[-1])

    metrics = _compute_metrics(
        req.initial_capital, final_value, equity_curve,
        trades, buyhold_final, period_years,
    )

    equity_points = [EquityPoint(**e) for e in equity_curve]

    return BacktestResponse(
        ticker=req.ticker.upper(),
        strategy=req.strategy,
        period=req.period,
        initial_capital=req.initial_capital,
        final_value=round(final_value, 2),
        metrics=metrics,
        trades=trades,
        equity_curve=equity_points,
    )
