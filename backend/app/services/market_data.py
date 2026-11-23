"""
Market data service using yfinance.
Fetches quotes, OHLCV history, and fundamental info.
"""
import yfinance as yf
import pandas as pd
from typing import List
from ..schemas.market import StockQuote, OHLCV


def _flatten_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Flatten MultiIndex columns produced by newer yfinance versions."""
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [col[0] for col in df.columns]
    return df


def get_stock_quote(ticker: str) -> StockQuote:
    t = yf.Ticker(ticker)
    try:
        info = t.info or {}
    except Exception:
        info = {}

    # Yahoo often blocks the full info call from cloud servers (it comes back empty).
    # fast_info uses the chart data, which still works there, so we use it as backup.
    fast = {}
    if not (info.get("currentPrice") or info.get("regularMarketPrice")):
        try:
            fi = t.fast_info
            fast = {
                "price": fi.get("lastPrice"),
                "prev_close": fi.get("previousClose"),
                "volume": fi.get("lastVolume"),
                "market_cap": fi.get("marketCap"),
                "high": fi.get("yearHigh"),
                "low": fi.get("yearLow"),
            }
        except Exception:
            fast = {}

    price = info.get("currentPrice") or info.get("regularMarketPrice") or fast.get("price") or 0.0
    prev_close = (info.get("previousClose") or info.get("regularMarketPreviousClose")
                  or fast.get("prev_close") or price)
    change = round(price - prev_close, 4)
    change_pct = round((change / prev_close * 100) if prev_close else 0.0, 4)

    return StockQuote(
        ticker=ticker.upper(),
        name=info.get("longName") or info.get("shortName") or ticker,
        price=round(price, 2),
        change=change,
        change_pct=change_pct,
        volume=info.get("volume") or info.get("regularMarketVolume") or fast.get("volume") or 0,
        market_cap=info.get("marketCap") or fast.get("market_cap"),
        pe_ratio=info.get("trailingPE"),
        week_52_high=info.get("fiftyTwoWeekHigh") or fast.get("high"),
        week_52_low=info.get("fiftyTwoWeekLow") or fast.get("low"),
        sector=info.get("sector"),
    )


def get_multiple_quotes(tickers: List[str]) -> List[StockQuote]:
    return [get_stock_quote(t) for t in tickers]


def get_ohlcv(ticker: str, period: str = "1y", interval: str = "1d") -> List[OHLCV]:
    """Fetch OHLCV history. period: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max"""
    df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
    if df.empty:
        return []

    df = _flatten_columns(df)

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
    df = _flatten_columns(df)
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
