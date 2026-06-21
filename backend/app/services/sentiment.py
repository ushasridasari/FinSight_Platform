"""
AI-powered sentiment analysis using Anthropic Claude.
Fetches news headlines via yfinance, sends them to Claude,
and returns a structured sentiment result.
"""
import json
import yfinance as yf
import anthropic
from ..core.config import settings
from ..schemas.market import SentimentResult


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _ai_available() -> bool:
    key = settings.anthropic_api_key
    return bool(key) and not key.startswith("your_") and key.startswith("sk-")


def _fetch_headlines(ticker: str) -> list[str]:
    try:
        t = yf.Ticker(ticker)
        news = t.news or []
        headlines = []
        for item in news[:20]:
            title = item.get("content", {}).get("title") or item.get("title", "")
            if title:
                headlines.append(title)
        return headlines
    except Exception:
        return []


def analyze_ticker_sentiment(ticker: str) -> SentimentResult:
    ticker = ticker.upper()
    headlines = _fetch_headlines(ticker)

    if not headlines:
        return SentimentResult(
            ticker=ticker,
            composite_score=0.0,
            label="Neutral",
            positive=0.0,
            neutral=1.0,
            negative=0.0,
            headline_count=0,
            ai_summary="No recent news headlines found for this ticker.",
        )

    if not _ai_available():
        return SentimentResult(
            ticker=ticker,
            composite_score=0.0,
            label="Neutral",
            positive=0.0,
            neutral=1.0,
            negative=0.0,
            headline_count=len(headlines),
            ai_summary="Set ANTHROPIC_API_KEY to enable AI sentiment analysis.",
        )

    headlines_text = "\n".join(f"- {h}" for h in headlines)

    prompt = f"""You are a financial news analyst. Analyze the sentiment of the following news headlines for {ticker} and respond ONLY with raw JSON (no markdown).

Headlines:
{headlines_text}

JSON format:
{{
  "label": "<Bullish | Bearish | Neutral>",
  "composite_score": <float between -1.0 (most bearish) and 1.0 (most bullish)>,
  "positive": <float 0.0-1.0: proportion of positive sentiment>,
  "neutral":  <float 0.0-1.0: proportion of neutral sentiment>,
  "negative": <float 0.0-1.0: proportion of negative sentiment>,
  "ai_summary": "<2-3 sentence summary of what the news is saying about {ticker} and why it is bullish/bearish/neutral>"
}}"""

    try:
        msg  = _client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(msg.content[0].text.strip())
    except Exception:
        data = {
            "label": "Neutral",
            "composite_score": 0.0,
            "positive": 0.0,
            "neutral": 1.0,
            "negative": 0.0,
            "ai_summary": "Sentiment analysis temporarily unavailable.",
        }

    return SentimentResult(
        ticker=ticker,
        composite_score=round(float(data.get("composite_score", 0.0)), 4),
        label=data.get("label", "Neutral"),
        positive=round(float(data.get("positive", 0.0)), 4),
        neutral=round(float(data.get("neutral", 1.0)), 4),
        negative=round(float(data.get("negative", 0.0)), 4),
        headline_count=len(headlines),
        ai_summary=data.get("ai_summary", ""),
    )
