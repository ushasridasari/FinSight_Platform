from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from ..models.portfolio import TransactionType


class HoldingCreate(BaseModel):
    ticker: str
    shares: float
    avg_cost: float
    sector: Optional[str] = None


class HoldingOut(BaseModel):
    id: int
    ticker: str
    shares: float
    avg_cost: float
    sector: Optional[str]

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    ticker: str
    transaction_type: TransactionType
    shares: float
    price: float
    notes: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    ticker: str
    transaction_type: TransactionType
    shares: float
    price: float
    executed_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True


class PortfolioCreate(BaseModel):
    name: str
    description: Optional[str] = None


class PortfolioOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    holdings: List[HoldingOut] = []

    class Config:
        from_attributes = True


class WatchlistAdd(BaseModel):
    ticker: str
    notes: Optional[str] = None


class WatchlistOut(BaseModel):
    id: int
    ticker: str
    added_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True
