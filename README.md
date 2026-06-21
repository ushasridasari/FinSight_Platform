# FinForesight — AI-Powered Financial Dashboard

> An intelligent financial dashboard that combines real-time market data visualization with machine learning predictions and AI-driven insights.

## Overview

FinForesight is a full-stack financial analytics platform designed for portfolio tracking, stock analysis, and AI-powered forecasting. Built as a graduate-level systems project demonstrating integration of modern web technologies with machine learning pipelines.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | FastAPI (Python 3.11+) |
| ML/AI | Prophet, scikit-learn, Anthropic Claude API |
| Data | yfinance, SQLite, SQLAlchemy |
| Auth | JWT (python-jose) |

## Features

- **Portfolio Dashboard** — Real-time P&L, allocation charts, performance metrics
- **Stock Screener** — Filter and analyze equities by fundamentals
- **AI Price Forecasting** — Prophet-based time-series predictions with confidence intervals
- **Sentiment Analysis** — NLP-driven market mood scoring
- **AI Insights** — Claude-powered natural language market summaries
- **Risk Analytics** — Sharpe ratio, VaR, beta, drawdown analysis
- **Backtesting Engine** — 4 strategies (SMA Crossover, RSI, Bollinger Bands, MACD) with equity curve vs buy-and-hold
- **Efficient Frontier** — Markowitz Monte Carlo optimization (3 000 portfolios), max-Sharpe and min-variance portfolios

## Project Structure

```
FinForesight/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── core/          # Config, security
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic & ML
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/              # React + TypeScript SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client layer
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript interfaces
│   ├── public/
│   └── package.json
└── docker-compose.yml
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # Starts on http://localhost:5173
```

### API Docs
Once the backend is running, visit `http://localhost:8000/docs` for interactive Swagger UI.

## ML Pipeline

### Price Forecasting
Uses Facebook's **Prophet** model trained on historical OHLCV data fetched via `yfinance`. Returns forecasts with uncertainty intervals over configurable horizons (7/30/90 days).

### Risk Metrics
- **Sharpe Ratio**: `(Rp - Rf) / σp`
- **Value at Risk (VaR)**: Historical simulation at 95% and 99% confidence
- **Maximum Drawdown**: Peak-to-trough decline over rolling windows
- **Beta**: Covariance of asset vs. market benchmark

### Sentiment Engine
Scores market news headlines using VADER sentiment analysis, aggregated into a composite market mood index.

## Environment Variables

```env
ANTHROPIC_API_KEY=your_key_here
SECRET_KEY=your_jwt_secret
DATABASE_URL=sqlite:///./finforesight.db
ENVIRONMENT=development
```

## Author

**Ushasri Dasari** — MS Software Engineering
