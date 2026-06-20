from fastapi import APIRouter, HTTPException, Query
from typing import List
from ..schemas.market import StockQuote, OHLCV, ForecastResponse, RiskMetrics, SentimentResult, AIInsightRequest, AIInsightResponse
from ..services import market_data, forecasting, risk, sentiment, ai_insights

router = APIRouter(prefix="/market", tags=["Market"])


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
def history(ticker: str, period: str = Query("1y", description="1d 5d 1mo 3mo 6mo 1y 2y 5y")):
    data = market_data.get_ohlcv(ticker.upper(), period=period)
    if not data:
        raise HTTPException(404, f"No data found for {ticker}")
    return data


@router.get("/movers")
def movers():
    return market_data.get_market_movers()


@router.get("/forecast/{ticker}", response_model=ForecastResponse)
def forecast(ticker: str, horizon: int = Query(30, ge=7, le=180, description="Forecast days")):
    try:
        return forecasting.get_forecast(ticker.upper(), horizon)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/risk/{ticker}", response_model=RiskMetrics)
def risk_metrics(ticker: str, benchmark: str = Query("SPY")):
    try:
        return risk.compute_risk_metrics(ticker.upper(), benchmark.upper())
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/sentiment/{ticker}", response_model=SentimentResult)
def get_sentiment(ticker: str):
    return sentiment.analyze_ticker_sentiment(ticker.upper())


@router.post("/ai-insight", response_model=AIInsightResponse)
def ai_insight(payload: AIInsightRequest):
    return ai_insights.get_ai_insight(payload.ticker.upper(), payload.context or "")


@router.get("/portfolio-risk")
def portfolio_risk(
    tickers: str = Query(..., description="Comma-separated tickers"),
    weights: str = Query(..., description="Comma-separated weights summing to 1.0"),
):
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    weight_list = [float(w.strip()) for w in weights.split(",")]
    if len(ticker_list) != len(weight_list):
        raise HTTPException(400, "Tickers and weights must have the same count")
    return risk.portfolio_risk_summary(ticker_list, weight_list)
