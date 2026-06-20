from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..core.database import Base


class TransactionType(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="portfolio", cascade="all, delete-orphan")


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    ticker = Column(String, nullable=False, index=True)
    shares = Column(Float, nullable=False)
    avg_cost = Column(Float, nullable=False)
    sector = Column(String)

    portfolio = relationship("Portfolio", back_populates="holdings")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    ticker = Column(String, nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    shares = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String)

    portfolio = relationship("Portfolio", back_populates="transactions")


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String)

    owner = relationship("User", back_populates="watchlists")
