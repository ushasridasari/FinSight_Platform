from fastapi import APIRouter, HTTPException
from ..schemas.analytics import BacktestRequest, BacktestResponse, OptimizeRequest, FrontierResponse
from ..services import backtesting, optimizer
from ..services import ai_insights

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post("/backtest", response_model=BacktestResponse)
def run_backtest(req: BacktestRequest):
    try:
        result = backtesting.run_backtest(req)
        try:
            m = result.metrics
            prompt_ctx = (
                f"Strategy: {req.strategy} on {req.ticker} over {req.period}. "
                f"Total return: {m.total_return_pct}% vs buy-and-hold {m.buyhold_return_pct}%. "
                f"Sharpe: {m.sharpe_ratio}, Max Drawdown: {m.max_drawdown}%, "
                f"Win Rate: {m.win_rate}%, Trades: {m.total_trades}."
            )
            if ai_insights._ai_available():
                ai_resp = ai_insights.get_ai_insight(req.ticker, prompt_ctx)
                result.ai_summary = ai_resp.get("insight") if isinstance(ai_resp, dict) else None
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
                result.ai_recommendation = ai_resp.get("insight") if isinstance(ai_resp, dict) else None
        except Exception:
            pass
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))
