"""
AI Insights service powered by Anthropic Claude.
Provides AI analysis across all application domains:
  - Single stock insight
  - Portfolio health check & rebalancing
  - Daily market summary
  - Forecast commentary
  - Watchlist batch scoring
"""
import json
import anthropic
from typing import List
from ..core.config import settings
from ..schemas.market import AIInsightResponse
from .market_data import get_stock_quote, get_market_movers
from .risk import compute_risk_metrics


# ── Shared helpers ────────────────────────────────────────────────────────────

def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _ai_available() -> bool:
    key = settings.anthropic_api_key
    # Reject empty or placeholder values
    return bool(key) and not key.startswith("your_") and key.startswith("sk-")


def _ask(prompt: str, max_tokens: int = 600) -> str:
    """Send a single-turn prompt to Claude and return the text response."""
    msg = _client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


def _safe_json(raw: str, fallback: dict) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return fallback


def _gather_stock_context(ticker: str, extra: str = "") -> str:
    lines = [f"Ticker: {ticker.upper()}"]
    try:
        q = get_stock_quote(ticker)
        lines += [
            f"Price: ${q.price} ({q.change_pct:+.2f}% today)",
            f"52W Range: ${q.week_52_low} – ${q.week_52_high}",
            f"Market Cap: ${q.market_cap:,.0f}" if q.market_cap else "Market Cap: N/A",
            f"P/E Ratio: {q.pe_ratio}" if q.pe_ratio else "P/E: N/A",
            f"Sector: {q.sector or 'N/A'}",
        ]
    except Exception:
        lines.append("(Price data unavailable)")

    try:
        risk = compute_risk_metrics(ticker)
        lines += [
            f"Sharpe Ratio (1Y): {risk.sharpe_ratio}",
            f"Annualized Return: {risk.annualized_return}%",
            f"Volatility: {risk.annualized_volatility}%",
            f"Max Drawdown: {risk.max_drawdown}%",
            f"VaR 95%: {risk.var_95}%",
            f"Beta: {risk.beta}" if risk.beta else "",
        ]
    except Exception:
        pass

    if extra:
        lines.append(f"User context: {extra}")

    return "\n".join(l for l in lines if l)


# ── 1. Single-stock insight ───────────────────────────────────────────────────

def get_ai_insight(ticker: str, context: str = "") -> AIInsightResponse:
    if not _ai_available():
        return AIInsightResponse(
            ticker=ticker.upper(),
            insight="Set ANTHROPIC_API_KEY in backend/.env to enable AI insights.",
            key_factors=["Configure ANTHROPIC_API_KEY to enable this feature."],
            risk_level="Unknown",
            recommendation="N/A",
        )

    market_data = _gather_stock_context(ticker, context)
    prompt = f"""You are a senior financial analyst. Analyze the data below for {ticker.upper()} and respond ONLY with raw JSON (no markdown).

{market_data}

JSON format:
{{
  "insight": "<2-3 sentence investment thesis>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "risk_level": "<Low | Medium | High | Very High>",
  "recommendation": "<Strong Buy | Buy | Hold | Sell | Strong Sell>"
}}"""

    raw = _ask(prompt, max_tokens=512)
    parsed = _safe_json(raw, {
        "insight": raw,
        "key_factors": [],
        "risk_level": "Unknown",
        "recommendation": "Hold",
    })

    return AIInsightResponse(
        ticker=ticker.upper(),
        insight=parsed.get("insight", ""),
        key_factors=parsed.get("key_factors", []),
        risk_level=parsed.get("risk_level", "Unknown"),
        recommendation=parsed.get("recommendation", "Hold"),
    )


# ── 2. Portfolio health check ─────────────────────────────────────────────────

def get_portfolio_ai_analysis(holdings: list) -> dict:
    """
    holdings: list of dicts with keys ticker, shares, avg_cost, current_price,
              pnl_pct, weight, sector
    """
    if not _ai_available():
        return {
            "summary": "Set ANTHROPIC_API_KEY to enable AI portfolio analysis.",
            "strengths": [],
            "risks": [],
            "rebalancing_suggestions": [],
            "overall_health": "Unknown",
        }

    lines = ["Portfolio Holdings:"]
    for h in holdings:
        if "error" in h:
            continue
        lines.append(
            f"  {h['ticker']}: {h['shares']} shares @ avg ${h['avg_cost']:.2f}, "
            f"now ${h.get('current_price', 0):.2f}, P&L {h.get('pnl_pct', 0):+.1f}%, "
            f"weight {h.get('weight', 0):.1f}%, sector {h.get('sector') or 'N/A'}"
        )

    prompt = f"""You are a portfolio advisor. Analyze this portfolio and respond ONLY with raw JSON (no markdown).

{chr(10).join(lines)}

JSON format:
{{
  "summary": "<2-3 sentence overall portfolio assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "rebalancing_suggestions": [
    {{"ticker": "<TICKER>", "action": "<Buy more | Trim | Hold | Exit>", "reason": "<one sentence>"}}
  ],
  "overall_health": "<Excellent | Good | Fair | Poor>"
}}"""

    raw = _ask(prompt, max_tokens=700)
    return _safe_json(raw, {
        "summary": raw,
        "strengths": [],
        "risks": [],
        "rebalancing_suggestions": [],
        "overall_health": "Unknown",
    })


# ── 3. Daily market summary ───────────────────────────────────────────────────

def get_market_summary() -> dict:
    if not _ai_available():
        return {
            "headline": "Set ANTHROPIC_API_KEY to enable AI market summaries.",
            "key_themes": [],
            "sector_outlook": [],
            "market_mood": "Unknown",
            "watch_today": [],
        }

    try:
        movers = get_market_movers()
        gainers = movers.get("gainers", [])
        losers  = movers.get("losers",  [])
        all_q   = movers.get("all", [])

        gainer_str = ", ".join(f"{q.ticker} (+{q.change_pct:.2f}%)" for q in gainers)
        loser_str  = ", ".join(f"{q.ticker} ({q.change_pct:.2f}%)"  for q in losers)

        # SPY mood
        spy = next((q for q in all_q if q.ticker == "SPY"), None)
        market_dir = f"SPY {spy.change_pct:+.2f}%" if spy else "SPY unavailable"

        context = f"""Today's market snapshot:
Market direction: {market_dir}
Top gainers: {gainer_str or 'N/A'}
Top losers:  {loser_str  or 'N/A'}
Stocks monitored: {', '.join(q.ticker for q in all_q)}"""

    except Exception:
        context = "Market data temporarily unavailable."

    prompt = f"""You are a financial market analyst writing a brief daily briefing. Respond ONLY with raw JSON (no markdown).

{context}

JSON format:
{{
  "headline": "<one punchy sentence summarizing today's market>",
  "key_themes": ["<theme 1>", "<theme 2>", "<theme 3>"],
  "sector_outlook": [
    {{"sector": "<sector name>", "outlook": "<Bullish | Neutral | Bearish>", "note": "<one sentence>"}}
  ],
  "market_mood": "<Risk-On | Risk-Off | Mixed | Cautious>",
  "watch_today": ["<ticker or event to watch>", "<another>"]
}}"""

    raw = _ask(prompt, max_tokens=600)
    return _safe_json(raw, {
        "headline": raw,
        "key_themes": [],
        "sector_outlook": [],
        "market_mood": "Mixed",
        "watch_today": [],
    })


# ── 4. Forecast AI commentary ─────────────────────────────────────────────────

def get_forecast_commentary(ticker: str, model: str, horizon_days: int,
                             predicted_price: float, current_price: float,
                             expected_move_pct: float, mape: float | None) -> dict:
    if not _ai_available():
        return {
            "commentary": "Set ANTHROPIC_API_KEY to enable AI forecast commentary.",
            "confidence": "Unknown",
            "key_assumptions": [],
            "downside_risks": [],
        }

    prompt = f"""You are a quantitative analyst reviewing a machine learning price forecast. Respond ONLY with raw JSON (no markdown).

Ticker: {ticker.upper()}
Forecast model: {model}
Horizon: {horizon_days} days
Current price: ${current_price:.2f}
Predicted price: ${predicted_price:.2f}
Expected move: {expected_move_pct:+.2f}%
Model MAPE: {f'{mape:.2f}%' if mape is not None else 'N/A'}

JSON format:
{{
  "commentary": "<2-3 sentence interpretation of this forecast>",
  "confidence": "<High | Medium | Low>",
  "key_assumptions": ["<assumption 1>", "<assumption 2>"],
  "downside_risks": ["<risk 1>", "<risk 2>"]
}}"""

    raw = _ask(prompt, max_tokens=450)
    return _safe_json(raw, {
        "commentary": raw,
        "confidence": "Unknown",
        "key_assumptions": [],
        "downside_risks": [],
    })


# ── 5. Risk metrics interpretation ───────────────────────────────────────────

def get_risk_interpretation(ticker: str, metrics: dict) -> dict:
    """
    Claude reads computed risk metrics and explains what they mean
    in plain English for this specific stock.
    """
    if not _ai_available():
        return {
            "interpretation": "Set ANTHROPIC_API_KEY to enable AI risk interpretation.",
            "risk_grade": "Unknown",
            "key_takeaways": [],
            "recommendation": "N/A",
        }

    prompt = f"""You are a risk analyst. Interpret the following risk metrics for {ticker.upper()} and explain what they mean to an investor in plain English. Respond ONLY with raw JSON (no markdown).

Risk Metrics for {ticker.upper()}:
- Sharpe Ratio: {metrics.get('sharpe_ratio')} (>1 is good, >2 is excellent)
- Annualized Return: {metrics.get('annualized_return')}%
- Annualized Volatility: {metrics.get('annualized_volatility')}%
- Max Drawdown: {metrics.get('max_drawdown')}% (worst peak-to-trough loss)
- VaR 95%: {metrics.get('var_95')}% (daily loss not exceeded 95% of time)
- VaR 99%: {metrics.get('var_99')}% (daily loss not exceeded 99% of time)
- Beta vs SPY: {metrics.get('beta', 'N/A')} (<1 = less volatile than market)
- Alpha: {metrics.get('alpha', 'N/A')}% (excess return above market)

JSON format:
{{
  "interpretation": "<3-4 sentence plain-English explanation of what these metrics tell us about this stock's risk profile>",
  "risk_grade": "<A | B | C | D | F>",
  "key_takeaways": ["<takeaway 1>", "<takeaway 2>", "<takeaway 3>"],
  "recommendation": "<how much portfolio weight is appropriate given this risk profile, e.g. 'Suitable for up to 10% portfolio weight for moderate risk investors'>"
}}"""

    raw = _ask(prompt, max_tokens=500)
    return _safe_json(raw, {
        "interpretation": raw,
        "risk_grade": "Unknown",
        "key_takeaways": [],
        "recommendation": "N/A",
    })


# ── 6. AI Portfolio Construction ──────────────────────────────────────────────

def get_ai_portfolio_weights(tickers: list, context: str = "") -> dict:
    """
    Claude suggests portfolio allocation weights for a basket of tickers
    based on their fundamentals and recent price performance.
    """
    if not _ai_available():
        n = len(tickers)
        return {
            "weights": {t: round(1/n, 4) for t in tickers},
            "rationale": "Set ANTHROPIC_API_KEY to enable AI portfolio construction.",
            "risk_profile": "Unknown",
            "rebalance_frequency": "N/A",
            "key_reasoning": [],
        }

    stock_lines = []
    for ticker in tickers:
        try:
            q = get_stock_quote(ticker)
            stock_lines.append(
                f"{ticker}: ${q.price} ({q.change_pct:+.2f}% today), "
                f"sector={q.sector or 'N/A'}, P/E={q.pe_ratio or 'N/A'}, "
                f"52W range ${q.week_52_low}–${q.week_52_high}"
            )
        except Exception:
            stock_lines.append(f"{ticker}: data unavailable")

    prompt = f"""You are a portfolio manager. Allocate weights across the following stocks to build a well-diversified, risk-adjusted portfolio. Weights must sum to exactly 1.0. Respond ONLY with raw JSON (no markdown).

Stocks:
{chr(10).join(stock_lines)}
{f'Additional context: {context}' if context else ''}

JSON format:
{{
  "weights": {{ "<TICKER>": <float weight 0-1>, ... }},
  "rationale": "<2-3 sentence explanation of the overall allocation strategy>",
  "risk_profile": "<Conservative | Moderate | Aggressive>",
  "rebalance_frequency": "<Monthly | Quarterly | Annually>",
  "key_reasoning": [
    {{"ticker": "<TICKER>", "weight_pct": <int>, "reason": "<one sentence why this weight>"}}
  ]
}}"""

    raw = _ask(prompt, max_tokens=700)
    result = _safe_json(raw, {
        "weights": {t: round(1/len(tickers), 4) for t in tickers},
        "rationale": raw,
        "risk_profile": "Moderate",
        "rebalance_frequency": "Quarterly",
        "key_reasoning": [],
    })

    # Normalize weights to sum to 1.0
    weights = result.get("weights", {})
    total = sum(weights.values()) or 1
    result["weights"] = {k: round(v / total, 4) for k, v in weights.items()}
    return result


# ── 7. Watchlist batch scoring ────────────────────────────────────────────────

def get_watchlist_scores(tickers: List[str]) -> List[dict]:
    """Return a quick AI score for each ticker — designed for speed, not depth."""
    if not _ai_available():
        return [{"ticker": t, "score": "N/A", "label": "API key required", "action": "N/A"} for t in tickers]

    summaries = []
    for t in tickers:
        try:
            q = get_stock_quote(t)
            summaries.append(f"{t}: ${q.price} ({q.change_pct:+.2f}% today), sector={q.sector or 'N/A'}")
        except Exception:
            summaries.append(f"{t}: price unavailable")

    prompt = f"""You are a financial analyst. Score each stock below from 1–10 (10 = strongest buy). Respond ONLY with raw JSON array (no markdown).

Stocks:
{chr(10).join(summaries)}

JSON format (array):
[
  {{"ticker": "<TICKER>", "score": <1-10>, "label": "<Bullish | Neutral | Bearish>", "action": "<Buy | Hold | Sell>", "reason": "<one sentence>"}}
]"""

    raw = _ask(prompt, max_tokens=600)
    result = _safe_json(raw, [])
    if not isinstance(result, list):
        result = []

    scored = {item["ticker"]: item for item in result if isinstance(item, dict)}
    return [scored.get(t, {"ticker": t, "score": 5, "label": "Neutral", "action": "Hold", "reason": "Unable to score"}) for t in tickers]
