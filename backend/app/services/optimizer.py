"""
Markowitz Efficient Frontier via Monte Carlo simulation.
Generates num_portfolios random weight vectors, computes return/volatility/Sharpe,
identifies the max-Sharpe and min-variance portfolios, and optionally adds AI commentary.
"""
import numpy as np
import pandas as pd
from typing import List

from ..schemas.analytics import (
    OptimizeRequest, FrontierResponse, PortfolioPoint, OptimalPortfolio,
)
from .market_data import get_ohlcv_dataframe

TRADING_DAYS = 252


def _annual_stats(weights: np.ndarray, mean_returns: np.ndarray, cov: np.ndarray, rfr: float):
    port_return = float(np.dot(weights, mean_returns) * TRADING_DAYS)
    port_vol    = float(np.sqrt(weights @ cov @ weights) * np.sqrt(TRADING_DAYS))
    sharpe      = (port_return - rfr) / (port_vol + 1e-9)
    return port_return, port_vol, sharpe


def run_optimizer(req: OptimizeRequest) -> FrontierResponse:
    tickers = [t.upper() for t in req.tickers]
    if len(tickers) < 2:
        raise ValueError("Need at least 2 tickers for portfolio optimization")

    # Download and align close prices
    frames = {}
    for ticker in tickers:
        df = get_ohlcv_dataframe(ticker, period=req.period)
        if df.empty:
            raise ValueError(f"No data for {ticker}")
        frames[ticker] = df["Close"]

    prices = pd.DataFrame(frames).dropna()
    if len(prices) < 60:
        raise ValueError("Insufficient overlapping price history (need ≥ 60 trading days)")

    daily_returns = prices.pct_change().dropna()
    mean_returns  = daily_returns.mean().values        # shape (n,)
    cov_matrix    = daily_returns.cov().values         # shape (n, n)
    n             = len(tickers)

    # Correlation matrix for display
    corr = daily_returns.corr().values.tolist()

    # Monte Carlo: sample random portfolios
    rng = np.random.default_rng(42)
    portfolios: List[PortfolioPoint] = []
    best_sharpe_val = -np.inf
    best_sharpe_w   = None
    best_var_val    = np.inf
    best_var_w      = None

    for _ in range(req.num_portfolios):
        raw     = rng.random(n)
        weights = raw / raw.sum()
        ret, vol, sharpe = _annual_stats(weights, mean_returns, cov_matrix, req.risk_free_rate)
        portfolios.append(PortfolioPoint(
            volatility=round(vol * 100, 4),
            ret=round(ret * 100, 4),
            sharpe=round(sharpe, 4),
            weights=[round(w, 6) for w in weights.tolist()],
        ))
        if sharpe > best_sharpe_val:
            best_sharpe_val = sharpe
            best_sharpe_w   = weights.copy()
        if vol < best_var_val:
            best_var_val = vol
            best_var_w   = weights.copy()

    def _to_optimal(w: np.ndarray) -> OptimalPortfolio:
        ret, vol, sharpe = _annual_stats(w, mean_returns, cov_matrix, req.risk_free_rate)
        return OptimalPortfolio(
            weights=[round(float(x), 6) for x in w],
            tickers=tickers,
            expected_return=round(ret * 100, 4),
            volatility=round(vol * 100, 4),
            sharpe_ratio=round(sharpe, 4),
        )

    equal_w = np.ones(n) / n

    return FrontierResponse(
        tickers=tickers,
        portfolios=portfolios,
        max_sharpe=_to_optimal(best_sharpe_w),
        min_variance=_to_optimal(best_var_w),
        equal_weight=_to_optimal(equal_w),
        correlation_matrix=[[round(v, 4) for v in row] for row in corr],
    )
