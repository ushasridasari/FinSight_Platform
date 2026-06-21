from fastapi import APIRouter, HTTPException
from ..schemas.analytics import (
    BacktestRequest, BacktestResponse,
    OptimizeRequest, FrontierResponse,
    AIPortfolioRequest, AIPortfolioResponse, AIWeightReason,
    AIRiskResponse,
)
from ..services import backtesting, optimizer, ai_insights
from ..services.risk import compute_risk_metrics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post("/backtest", response_model=BacktestResponse)
def run_backtest(req: BacktestRequest):
    try:
        result = backtesting.run_backtest(req)
        try:
            if ai_insights._ai_available():
                m = result.metrics
                prompt_ctx = (
                    f"Strategy: {req.strategy} on {req.ticker} over {req.period}. "
                    f"Total return: {m.total_return_pct}% vs buy-and-hold {m.buyhold_return_pct}%. "
                    f"Sharpe: {m.sharpe_ratio}, Max Drawdown: {m.max_drawdown}%, "
                    f"Win Rate: {m.win_rate}%, Trades: {m.total_trades}."
                )
                ai_resp = ai_insights.get_ai_insight(req.ticker, prompt_ctx)
                result.ai_summary = getattr(ai_resp, "insight", None)
        except Exception:
            pass
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/optimize", response_model=FrontierResponse)
def run_optimizer(req: OptimizeRequest):
    try:
        result = optimizer.run_optimizer(req)
        try:
            if ai_insights._ai_available():
                ms = result.max_sharpe
                ctx = (
                    f"Efficient frontier for {', '.join(result.tickers)}. "
                    f"Max-Sharpe portfolio: weights {dict(zip(result.tickers, ms.weights))}, "
                    f"expected return {ms.expected_return}%, volatility {ms.volatility}%, "
                    f"Sharpe {ms.sharpe_ratio}. "
                    f"Min-variance volatility: {result.min_variance.volatility}%."
                )
                ai_resp = ai_insights.get_ai_insight(result.tickers[0], ctx)
                result.ai_recommendation = getattr(ai_resp, "insight", None)
        except Exception:
            pass
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/ai-portfolio", response_model=AIPortfolioResponse)
def ai_portfolio_construction(req: AIPortfolioRequest):
    """Claude AI constructs an optimal portfolio allocation for the given tickers."""
    if len(req.tickers) < 2:
        raise HTTPException(400, "Provide at least 2 tickers")
    try:
        result = ai_insights.get_ai_portfolio_weights(
            [t.upper() for t in req.tickers],
            context=req.context or "",
        )
        reasoning = [
            AIWeightReason(**r) if isinstance(r, dict) else r
            for r in result.get("key_reasoning", [])
        ]
        return AIPortfolioResponse(
            weights=result.get("weights", {}),
            rationale=result.get("rationale", ""),
            risk_profile=result.get("risk_profile", "Moderate"),
            rebalance_frequency=result.get("rebalance_frequency", "Quarterly"),
            key_reasoning=reasoning,
        )
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/ai-risk/{ticker}", response_model=AIRiskResponse)
def ai_risk_interpretation(ticker: str, benchmark: str = "SPY"):
    """Compute risk metrics then have Claude AI explain what they mean."""
    ticker = ticker.upper()
    try:
        metrics = compute_risk_metrics(ticker, benchmark)
        metrics_dict = {
            "sharpe_ratio":         metrics.sharpe_ratio,
            "annualized_return":    metrics.annualized_return,
            "annualized_volatility": metrics.annualized_volatility,
            "max_drawdown":         metrics.max_drawdown,
            "var_95":               metrics.var_95,
            "var_99":               metrics.var_99,
            "beta":                 metrics.beta,
            "alpha":                metrics.alpha,
        }
        interpretation = ai_insights.get_risk_interpretation(ticker, metrics_dict)
        return AIRiskResponse(
            ticker=ticker,
            interpretation=interpretation.get("interpretation", ""),
            risk_grade=interpretation.get("risk_grade", "Unknown"),
            key_takeaways=interpretation.get("key_takeaways", []),
            recommendation=interpretation.get("recommendation", ""),
            metrics=metrics_dict,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))
