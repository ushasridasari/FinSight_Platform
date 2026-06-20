from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..api.auth import get_current_user
from ..models.user import User
from ..models.portfolio import Portfolio, Holding, Transaction, Watchlist
from ..schemas.portfolio import (
    PortfolioCreate, PortfolioOut,
    HoldingCreate, HoldingOut,
    TransactionCreate, TransactionOut,
    WatchlistAdd, WatchlistOut,
)
from ..services.market_data import get_stock_quote

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


# ── Portfolios ──────────────────────────────────────────────────────────────

@router.get("/", response_model=List[PortfolioOut])
def list_portfolios(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Portfolio).filter(Portfolio.user_id == user.id).all()


@router.post("/", response_model=PortfolioOut, status_code=201)
def create_portfolio(payload: PortfolioCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = Portfolio(name=payload.name, description=payload.description, user_id=user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{portfolio_id}", status_code=204)
def delete_portfolio(portfolio_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Portfolio not found")
    db.delete(p)
    db.commit()


# ── Holdings ─────────────────────────────────────────────────────────────────

@router.post("/{portfolio_id}/holdings", response_model=HoldingOut, status_code=201)
def add_holding(portfolio_id: int, payload: HoldingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Portfolio not found")
    h = Holding(portfolio_id=portfolio_id, **payload.model_dump())
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.delete("/{portfolio_id}/holdings/{holding_id}", status_code=204)
def remove_holding(portfolio_id: int, holding_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Portfolio not found")
    h = db.query(Holding).filter(Holding.id == holding_id, Holding.portfolio_id == portfolio_id).first()
    if not h:
        raise HTTPException(404, "Holding not found")
    db.delete(h)
    db.commit()


# ── Transactions ──────────────────────────────────────────────────────────────

@router.post("/{portfolio_id}/transactions", response_model=TransactionOut, status_code=201)
def add_transaction(portfolio_id: int, payload: TransactionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Portfolio not found")
    t = Transaction(portfolio_id=portfolio_id, **payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/{portfolio_id}/transactions", response_model=List[TransactionOut])
def list_transactions(portfolio_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Portfolio not found")
    return db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).order_by(Transaction.executed_at.desc()).all()


# ── Portfolio Valuation ───────────────────────────────────────────────────────

@router.get("/{portfolio_id}/valuation")
def portfolio_valuation(portfolio_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Portfolio not found")

    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()
    total_value = 0.0
    total_cost = 0.0
    breakdown = []

    for h in holdings:
        try:
            q = get_stock_quote(h.ticker)
            current_value = q.price * h.shares
            cost_basis = h.avg_cost * h.shares
            pnl = current_value - cost_basis
            pnl_pct = (pnl / cost_basis * 100) if cost_basis else 0

            total_value += current_value
            total_cost += cost_basis
            breakdown.append({
                "ticker": h.ticker,
                "shares": h.shares,
                "avg_cost": h.avg_cost,
                "current_price": q.price,
                "current_value": round(current_value, 2),
                "cost_basis": round(cost_basis, 2),
                "pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 2),
                "weight": 0,  # filled below
                "sector": h.sector or q.sector,
            })
        except Exception:
            breakdown.append({"ticker": h.ticker, "error": "Failed to fetch price"})

    for item in breakdown:
        if total_value > 0 and "current_value" in item:
            item["weight"] = round(item["current_value"] / total_value * 100, 2)

    total_pnl = total_value - total_cost
    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": p.name,
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round((total_pnl / total_cost * 100) if total_cost else 0, 2),
        "holdings": breakdown,
    }


# ── Watchlist ─────────────────────────────────────────────────────────────────

@router.get("/watchlist", response_model=List[WatchlistOut])
def get_watchlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Watchlist).filter(Watchlist.user_id == user.id).all()


@router.post("/watchlist", response_model=WatchlistOut, status_code=201)
def add_to_watchlist(payload: WatchlistAdd, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(Watchlist).filter(Watchlist.user_id == user.id, Watchlist.ticker == payload.ticker.upper()).first()
    if existing:
        raise HTTPException(400, f"{payload.ticker} already in watchlist")
    w = Watchlist(user_id=user.id, ticker=payload.ticker.upper(), notes=payload.notes)
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@router.delete("/watchlist/{watchlist_id}", status_code=204)
def remove_from_watchlist(watchlist_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    w = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user.id).first()
    if not w:
        raise HTTPException(404, "Watchlist item not found")
    db.delete(w)
    db.commit()
