from pydantic import BaseModel
from typing import List, Optional, Any


# ── Backtesting ───────────────────────────────────────────────────────────────

class BacktestRequest(BaseModel):
    ticker: str
    strategy: str          # "sma_crossover" | "rsi" | "bollinger" | "macd"
    period: str = "2y"
    initial_capital: float = 10000.0
    # Strategy-specific params
    short_window: int = 20   # SMA short / Bollinger window
    long_window: int = 50    # SMA long
    rsi_period: int = 14
    rsi_oversold: float = 30.0
    rsi_overbought: float = 70.0
    macd_fast: int = 12
    macd_slow: int = 26
    macd_signal: int = 9


class Trade(BaseModel):
    date: str
    action: str            # "BUY" | "SELL"
    price: float
    shares: float
    portfolio_value: float
    pnl: Optional[float] = None


class EquityPoint(BaseModel):
    date: str
    strategy_value: float
    buyhold_value: float


class BacktestMetrics(BaseModel):
    total_return_pct: float
    buyhold_return_pct: float
    annualized_return: float
    annualized_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    total_trades: int
    profitable_trades: int
    avg_trade_pnl: float


class BacktestResponse(BaseModel):
    ticker: str
    strategy: str
    period: str
    initial_capital: float
    final_value: float
    metrics: BacktestMetrics
    trades: List[Trade]
    equity_curve: List[EquityPoint]
    ai_summary: Optional[str] = None


# ── Efficient Frontier ────────────────────────────────────────────────────────

class OptimizeRequest(BaseModel):
    tickers: List[str]
    period: str = "2y"
    num_portfolios: int = 3000
    risk_free_rate: float = 0.05


class PortfolioPoint(BaseModel):
    volatility: float
    ret: float
    sharpe: float
    weights: List[float]


class OptimalPortfolio(BaseModel):
    weights: List[float]
    tickers: List[str]
    expected_return: float
    volatility: float
    sharpe_ratio: float


class FrontierResponse(BaseModel):
    tickers: List[str]
    portfolios: List[PortfolioPoint]          # all simulated portfolios
    max_sharpe: OptimalPortfolio
    min_variance: OptimalPortfolio
    equal_weight: OptimalPortfolio
    correlation_matrix: List[List[float]]
    ai_recommendation: Optional[str] = None


# ── AI Portfolio Construction ─────────────────────────────────────────────────

class AIPortfolioRequest(BaseModel):
    tickers: List[str]
    context: Optional[str] = None


class AIWeightReason(BaseModel):
    ticker: str
    weight_pct: int
    reason: str


class AIPortfolioResponse(BaseModel):
    weights: dict                        # {ticker: float}
    rationale: str
    risk_profile: str
    rebalance_frequency: str
    key_reasoning: List[AIWeightReason]


# ── AI Risk Interpretation ────────────────────────────────────────────────────

class AIRiskResponse(BaseModel):
    ticker: str
    interpretation: str
    risk_grade: str
    key_takeaways: List[str]
    recommendation: str
    metrics: dict                        # raw numbers for reference
