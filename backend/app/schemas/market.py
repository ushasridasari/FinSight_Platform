from pydantic import BaseModel
from typing import List, Optional, Any


class OHLCV(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class StockQuote(BaseModel):
    ticker: str
    name: str
    price: float
    change: float
    change_pct: float
    volume: float
    market_cap: Optional[float]
    pe_ratio: Optional[float]
    week_52_high: Optional[float]
    week_52_low: Optional[float]
    sector: Optional[str]


class ForecastPoint(BaseModel):
    date: str
    predicted: float
    lower_bound: float
    upper_bound: float


class ForecastResponse(BaseModel):
    ticker: str
    horizon_days: int
    model: str
    historical: List[OHLCV]
    forecast: List[ForecastPoint]
    metrics: dict
    ai_commentary: Optional[dict] = None


class RiskMetrics(BaseModel):
    ticker: str
    sharpe_ratio: float
    annualized_return: float
    annualized_volatility: float
    max_drawdown: float
    var_95: float
    var_99: float
    beta: Optional[float]
    alpha: Optional[float]


class SentimentResult(BaseModel):
    ticker: str
    composite_score: float
    label: str
    positive: float
    neutral: float
    negative: float
    headline_count: int
    ai_summary: Optional[str] = None


class AIInsightRequest(BaseModel):
    ticker: str
    context: Optional[str] = None


class AIInsightResponse(BaseModel):
    ticker: str
    insight: str
    key_factors: List[str]
    risk_level: str
    recommendation: str


class MarketSummaryResponse(BaseModel):
    headline: str
    key_themes: List[str]
    sector_outlook: List[Any]
    market_mood: str
    watch_today: List[str]


class WatchlistScoreItem(BaseModel):
    ticker: str
    score: Any
    label: str
    action: str
    reason: str


class PortfolioAIRequest(BaseModel):
    holdings: List[dict]


class ForecastCommentaryRequest(BaseModel):
    ticker: str
    model: str
    horizon_days: int
    predicted_price: float
    current_price: float
    expected_move_pct: float
    mape: Optional[float] = None
