"""
Market data service using yfinance.
Fetches quotes, OHLCV history, and fundamental info.
"""
import yfinance as yf
import pandas as pd
from typing import List, Optional
from ..schemas.market import StockQuote, OHLCV


def get_stock_quote(ticker: str) -> StockQuote:
    t = yf.Ticker(ticker)
    info = t.info

    price = info.get("currentPrice") or info.get("regularMarketPrice", 0.0)
    prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose", price)
    change = round(price - prev_close, 4)
    change_pct = round((change / prev_close * 100) if prev_close else 0.0, 4)

    return StockQuote(
        ticker=ticker.upper(),
        name=info.get("longName") or info.get("shortName") or ticker,
        price=round(price, 2),
        change=change,
        change_pct=change_pct,
        volume=info.get("volume") or info.get("regularMarketVolume") or 0,
        market_cap=info.get("marketCap"),
        pe_ratio=info.get("trailingPE"),
        week_52_high=info.get("fiftyTwoWeekHigh"),
        week_52_low=info.get("fiftyTwoWeekLow"),
        sector=info.get("sector"),
    )


def get_multiple_quotes(tickers: List[str]) -> List[StockQuote]:
    return [get_stock_quote(t) for t in tickers]


def get_ohlcv(ticker: str, period: str = "1y", interval: str = "1d") -> List[OHLCV]:
    """Fetch OHLCV history. period: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max"""
    df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
    if df.empty:
        return []

    result = []
    for idx, row in df.iterrows():
        result.append(OHLCV(
            date=str(idx.date()),
            open=round(float(row["Open"]), 4),
            high=round(float(row["High"]), 4),
            low=round(float(row["Low"]), 4),
            close=round(float(row["Close"]), 4),
            volume=float(row["Volume"]),
        ))
    return result


def get_ohlcv_dataframe(ticker: str, period: str = "2y") -> pd.DataFrame:
    df = yf.download(ticker, period=period, interval="1d", progress=False, auto_adjust=True)
    df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]
    df.index = pd.to_datetime(df.index)
    return df.dropna()


def get_market_movers() -> dict:
    """Return today's notable gainers/losers from a curated list."""
    watchlist = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "JNJ", "V"]
    quotes = get_multiple_quotes(watchlist)
    sorted_by_change = sorted(quotes, key=lambda q: q.change_pct, reverse=True)
    return {
        "gainers": sorted_by_change[:3],
        "losers": sorted_by_change[-3:],
        "all": quotes,
    }
