from fastapi import APIRouter, HTTPException, Query
from typing import List
from ..schemas.market import (
    StockQuote, OHLCV, ForecastResponse, RiskMetrics, SentimentResult,
    AIInsightRequest, AIInsightResponse, MarketSummaryResponse,
    WatchlistScoreItem, PortfolioAIRequest, ForecastCommentaryRequest,
)
from ..services import market_data, forecasting, risk, sentiment, ai_insights

router = APIRouter(prefix="/market", tags=["Market"])


# ── Market data ───────────────────────────────────────────────────────────────

@router.get("/quote/{ticker}", response_model=StockQuote)
def quote(ticker: str):
    try:
        return market_data.get_stock_quote(ticker.upper())
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/quotes", response_model=List[StockQuote])
def multi_quote(tickers: str = Query(..., description="Comma-separated tickers e.g. AAPL,MSFT")):
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        raise HTTPException(400, "Provide at least one ticker")
    return market_data.get_multiple_quotes(ticker_list)


@router.get("/history/{ticker}", response_model=List[OHLCV])
def history(ticker: str, period: str = Query("1y")):
    data = market_data.get_ohlcv(ticker.upper(), period=period)
    if not data:
        raise HTTPException(404, f"No data found for {ticker}")
    return data


@router.get("/movers")
def movers():
    return market_data.get_market_movers()


# ── ML Forecasting ────────────────────────────────────────────────────────────

@router.get("/forecast/{ticker}", response_model=ForecastResponse)
def forecast(ticker: str, horizon: int = Query(30, ge=7, le=180), with_ai: bool = Query(True)):
    try:
        result = forecasting.get_forecast(ticker.upper(), horizon)
        if with_ai:
            try:
                last = result.forecast[-1] if result.forecast else None
                hist_last = result.historical[-1] if result.historical else None
                if last and hist_last:
                    move_pct = (last.predicted - hist_last.close) / hist_last.close * 100
                    mape = result.metrics.get("mape")
                    result.ai_commentary = ai_insights.get_forecast_commentary(
                        ticker=ticker.upper(),
                        model=result.model,
                        horizon_days=horizon,
                        predicted_price=last.predicted,
                        current_price=hist_last.close,
                        expected_move_pct=move_pct,
                        mape=float(mape) if mape is not None else None,
                    )
            except Exception:
                result.ai_commentary = None
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Risk ──────────────────────────────────────────────────────────────────────

@router.get("/risk/{ticker}", response_model=RiskMetrics)
def risk_metrics(ticker: str, benchmark: str = Query("SPY")):
    try:
        return risk.compute_risk_metrics(ticker.upper(), benchmark.upper())
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/portfolio-risk")
def portfolio_risk(
    tickers: str = Query(...),
    weights: str = Query(...),
):
    ticker_list  = [t.strip().upper() for t in tickers.split(",")]
    weight_list  = [float(w.strip()) for w in weights.split(",")]
    if len(ticker_list) != len(weight_list):
        raise HTTPException(400, "Tickers and weights must have the same count")
    return risk.portfolio_risk_summary(ticker_list, weight_list)


# ── Sentiment ─────────────────────────────────────────────────────────────────

@router.get("/sentiment/{ticker}", response_model=SentimentResult)
def get_sentiment(ticker: str):
    return sentiment.analyze_ticker_sentiment(ticker.upper())


# ── AI endpoints ──────────────────────────────────────────────────────────────

@router.post("/ai-insight", response_model=AIInsightResponse)
def ai_insight(payload: AIInsightRequest):
    return ai_insights.get_ai_insight(payload.ticker.upper(), payload.context or "")


@router.get("/ai-summary", response_model=MarketSummaryResponse)
def ai_market_summary():
    """AI-generated daily market briefing — powered by Claude."""
    result = ai_insights.get_market_summary()
    return MarketSummaryResponse(**result)


@router.post("/ai-portfolio-analysis")
def ai_portfolio_analysis(payload: PortfolioAIRequest):
    """AI portfolio health check and rebalancing suggestions."""
    return ai_insights.get_portfolio_ai_analysis(payload.holdings)


@router.post("/ai-forecast-commentary")
def ai_forecast_commentary(payload: ForecastCommentaryRequest):
    """AI commentary on a specific forecast result."""
    return ai_insights.get_forecast_commentary(
        ticker=payload.ticker,
        model=payload.model,
        horizon_days=payload.horizon_days,
        predicted_price=payload.predicted_price,
        current_price=payload.current_price,
        expected_move_pct=payload.expected_move_pct,
        mape=payload.mape,
    )


@router.get("/ai-watchlist-scores")
def ai_watchlist_scores(tickers: str = Query(..., description="Comma-separated tickers")):
    """Batch AI scoring for watchlist tickers."""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        raise HTTPException(400, "Provide at least one ticker")
    return ai_insights.get_watchlist_scores(ticker_list)
