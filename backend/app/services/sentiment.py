"""
Sentiment analysis service.
Uses VADER to score market news headlines fetched via yfinance.
Returns a composite sentiment score and per-article breakdown.
"""
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import List
from ..schemas.market import SentimentResult

_analyzer = SentimentIntensityAnalyzer()


def _score_text(text: str) -> dict:
    return _analyzer.polarity_scores(text)


def analyze_ticker_sentiment(ticker: str) -> SentimentResult:
    t = yf.Ticker(ticker)
    headlines: List[str] = []

    try:
        news = t.news or []
        for item in news[:20]:
            title = item.get("content", {}).get("title") or item.get("title", "")
            if title:
                headlines.append(title)
    except Exception:
        pass

    if not headlines:
        # No news — return neutral
        return SentimentResult(
            ticker=ticker.upper(),
            composite_score=0.0,
            label="Neutral",
            positive=0.0,
            neutral=1.0,
            negative=0.0,
            headline_count=0,
        )

    scores = [_score_text(h) for h in headlines]
    composite = sum(s["compound"] for s in scores) / len(scores)
    pos = sum(s["pos"] for s in scores) / len(scores)
    neu = sum(s["neu"] for s in scores) / len(scores)
    neg = sum(s["neg"] for s in scores) / len(scores)

    if composite >= 0.05:
        label = "Bullish"
    elif composite <= -0.05:
        label = "Bearish"
    else:
        label = "Neutral"

    return SentimentResult(
        ticker=ticker.upper(),
        composite_score=round(composite, 4),
        label=label,
        positive=round(pos, 4),
        neutral=round(neu, 4),
        negative=round(neg, 4),
        headline_count=len(headlines),
    )
