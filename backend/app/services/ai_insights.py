"""
AI Insights service powered by Anthropic Claude.
Generates natural-language market analysis from quantitative signals.
"""
import anthropic
from ..core.config import settings
from ..schemas.market import AIInsightResponse
from .market_data import get_stock_quote
from .risk import compute_risk_metrics
from .sentiment import analyze_ticker_sentiment


def _build_context(ticker: str, extra_context: str = "") -> str:
    lines = [f"Ticker: {ticker.upper()}"]
    try:
        q = get_stock_quote(ticker)
        lines.append(f"Current Price: ${q.price} ({q.change_pct:+.2f}% today)")
        lines.append(f"52-Week Range: ${q.week_52_low} – ${q.week_52_high}")
        lines.append(f"Market Cap: ${q.market_cap:,.0f}" if q.market_cap else "Market Cap: N/A")
        lines.append(f"P/E Ratio: {q.pe_ratio}" if q.pe_ratio else "P/E: N/A")
        lines.append(f"Sector: {q.sector or 'N/A'}")
    except Exception:
        lines.append("(Price data unavailable)")

    try:
        risk = compute_risk_metrics(ticker)
        lines.append(f"Sharpe Ratio (1Y): {risk.sharpe_ratio}")
        lines.append(f"Annualized Return: {risk.annualized_return}%")
        lines.append(f"Annualized Volatility: {risk.annualized_volatility}%")
        lines.append(f"Max Drawdown: {risk.max_drawdown}%")
        lines.append(f"VaR 95%: {risk.var_95}%")
        if risk.beta:
            lines.append(f"Beta: {risk.beta}")
    except Exception:
        lines.append("(Risk data unavailable)")

    try:
        sentiment = analyze_ticker_sentiment(ticker)
        lines.append(f"Market Sentiment: {sentiment.label} (score: {sentiment.composite_score})")
        lines.append(f"Headlines analyzed: {sentiment.headline_count}")
    except Exception:
        pass

    if extra_context:
        lines.append(f"Additional context: {extra_context}")

    return "\n".join(lines)


def get_ai_insight(ticker: str, context: str = "") -> AIInsightResponse:
    if not settings.anthropic_api_key:
        return AIInsightResponse(
            ticker=ticker.upper(),
            insight="AI insights require an ANTHROPIC_API_KEY. Please configure it in your .env file.",
            key_factors=["Configure ANTHROPIC_API_KEY to enable this feature."],
            risk_level="Unknown",
            recommendation="N/A",
        )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    market_data = _build_context(ticker, context)

    prompt = f"""You are a senior financial analyst. Analyze the following market data for {ticker.upper()} and provide a concise investment insight.

Market Data:
{market_data}

Respond in this exact JSON format (no markdown, just raw JSON):
{{
  "insight": "<2-3 sentence summary of the investment thesis>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "risk_level": "<Low | Medium | High | Very High>",
  "recommendation": "<Strong Buy | Buy | Hold | Sell | Strong Sell>"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    raw = message.content[0].text.strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {
            "insight": raw,
            "key_factors": [],
            "risk_level": "Unknown",
            "recommendation": "Hold",
        }

    return AIInsightResponse(
        ticker=ticker.upper(),
        insight=parsed.get("insight", ""),
        key_factors=parsed.get("key_factors", []),
        risk_level=parsed.get("risk_level", "Unknown"),
        recommendation=parsed.get("recommendation", "Hold"),
    )
