"""
Risk analytics service.
Computes Sharpe ratio, VaR, max drawdown, beta, and alpha.
"""
import numpy as np
import pandas as pd
from typing import Optional
from ..schemas.market import RiskMetrics
from .market_data import get_ohlcv_dataframe

RISK_FREE_RATE = 0.05   # 5% annual T-bill proxy
TRADING_DAYS = 252


def _daily_returns(df: pd.DataFrame) -> np.ndarray:
    closes = df["Close"].values.flatten()
    return np.diff(closes) / closes[:-1]


def _max_drawdown(prices: np.ndarray) -> float:
    peak = np.maximum.accumulate(prices)
    drawdown = (prices - peak) / (peak + 1e-9)
    return float(np.min(drawdown))


def compute_risk_metrics(ticker: str, benchmark: str = "SPY") -> RiskMetrics:
    df = get_ohlcv_dataframe(ticker, period="1y")
    if df.empty or len(df) < 30:
        raise ValueError(f"Insufficient data for {ticker}")

    returns = _daily_returns(df)

    ann_return = float(np.mean(returns) * TRADING_DAYS)
    ann_vol = float(np.std(returns) * np.sqrt(TRADING_DAYS))
    sharpe = (ann_return - RISK_FREE_RATE) / (ann_vol + 1e-9)

    closes = df["Close"].values.flatten()
    max_dd = _max_drawdown(closes)

    # Historical VaR
    var_95 = float(np.percentile(returns, 5))
    var_99 = float(np.percentile(returns, 1))

    # Beta vs benchmark
    beta: Optional[float] = None
    alpha: Optional[float] = None
    try:
        bdf = get_ohlcv_dataframe(benchmark, period="1y")
        if not bdf.empty:
            bench_returns = _daily_returns(bdf)
            min_len = min(len(returns), len(bench_returns))
            r = returns[-min_len:]
            b = bench_returns[-min_len:]
            cov_matrix = np.cov(r, b)
            beta = float(cov_matrix[0, 1] / (cov_matrix[1, 1] + 1e-9))
            bench_ann = float(np.mean(b) * TRADING_DAYS)
            alpha = float(ann_return - (RISK_FREE_RATE + beta * (bench_ann - RISK_FREE_RATE)))
    except Exception:
        pass

    return RiskMetrics(
        ticker=ticker.upper(),
        sharpe_ratio=round(sharpe, 4),
        annualized_return=round(ann_return * 100, 4),
        annualized_volatility=round(ann_vol * 100, 4),
        max_drawdown=round(max_dd * 100, 4),
        var_95=round(var_95 * 100, 4),
        var_99=round(var_99 * 100, 4),
        beta=round(beta, 4) if beta is not None else None,
        alpha=round(alpha * 100, 4) if alpha is not None else None,
    )


def portfolio_risk_summary(tickers: list, weights: list) -> dict:
    """
    Markowitz-style portfolio metrics.
    weights should sum to 1.0 and align positionally with tickers.
    """
    weights = np.array(weights, dtype=float)
    weights /= weights.sum()

    returns_matrix = []
    for t in tickers:
        try:
            df = get_ohlcv_dataframe(t, period="1y")
            r = _daily_returns(df)
            returns_matrix.append(r)
        except Exception:
            returns_matrix.append(np.zeros(252))

    min_len = min(len(r) for r in returns_matrix)
    R = np.column_stack([r[-min_len:] for r in returns_matrix])

    port_returns = R @ weights
    ann_return = float(np.mean(port_returns) * TRADING_DAYS)
    ann_vol = float(np.std(port_returns) * np.sqrt(TRADING_DAYS))
    sharpe = (ann_return - RISK_FREE_RATE) / (ann_vol + 1e-9)

    cov = np.cov(R.T)
    port_var = float(weights @ cov @ weights.T * TRADING_DAYS)

    return {
        "annualized_return": round(ann_return * 100, 4),
        "annualized_volatility": round(ann_vol * 100, 4),
        "portfolio_variance": round(port_var, 6),
        "sharpe_ratio": round(sharpe, 4),
        "var_95": round(float(np.percentile(port_returns, 5)) * 100, 4),
    }
