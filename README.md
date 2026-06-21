# FinForesight — AI-Powered Financial Dashboard

> A full-stack financial analytics platform combining real-time market data, machine learning forecasting, portfolio management, backtesting, and Claude AI-driven insights.

## Overview

FinForesight is a graduate-level systems project built by an MS Software Engineering student. It demonstrates end-to-end integration of modern web technologies with ML pipelines — from a FastAPI backend with SQLAlchemy ORM to a React/TypeScript SPA with live charts and an Anthropic Claude AI layer woven across every page.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS (dark theme) |
| Charts | Recharts (AreaChart, ComposedChart, ScatterChart, RadialBar, PieChart) |
| State | Zustand (persisted auth store), TanStack Query v5 |
| HTTP | Axios with JWT interceptor, auto 401 redirect |
| Backend | FastAPI (Python 3.11+), Uvicorn |
| ORM | SQLAlchemy, SQLite |
| Auth | JWT (python-jose), bcrypt (direct, no passlib) |
| ML — Forecasting | Facebook Prophet (primary), scikit-learn Polynomial Ridge (fallback) |
| ML — Sentiment | VADER NLP sentiment analysis |
| ML — Risk | Sharpe ratio, VaR 95/99, max drawdown, beta/alpha (NumPy/pandas) |
| ML — Backtesting | SMA Crossover, RSI, Bollinger Bands, MACD (pandas-based walk-forward) |
| ML — Portfolio | Markowitz Efficient Frontier via Monte Carlo simulation (3 000 portfolios) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) — 5 distinct AI endpoints |
| Market Data | yfinance (OHLCV, quotes, news headlines) |
| Infrastructure | Docker, Docker Compose, Nginx (frontend), multi-stage builds |

---

## Pages & Features

| Page | What it does |
|------|-------------|
| **Dashboard** | AI Daily Briefing card (Claude market summary), SPY 3-month price chart, top market movers table |
| **Market** | Ticker search → live quote, 1-year price chart, risk metrics, sentiment gauge; AI analysis auto-runs per search |
| **Forecast** | Prophet price forecast with confidence bands (7/30/90-day horizon); AI commentary panel explains the prediction |
| **Portfolio** | Add/remove holdings and transactions, live P&L, allocation donut chart; "Run AI Portfolio Analysis" for rebalancing suggestions |
| **Watchlist** | Tracked tickers with live prices; "AI Score All" batch-rates every ticker with conviction score and rationale |
| **AI Insights** | Deep single-stock analysis — paste any context, Claude returns outlook, risks, catalysts, and sentiment |
| **Backtest** | Configure any of 4 strategies, run walk-forward simulation, view equity curve vs buy-and-hold, full trade log and 10 performance metrics |
| **Optimizer** | Enter a basket of tickers, simulate 3 000 random portfolios, view Efficient Frontier scatter, max-Sharpe / min-variance / equal-weight weight breakdowns, and correlation matrix |

---

## AI Integration (Claude)

Five Claude-backed endpoints, all gracefully degrade to `null` when no API key is configured:

| Endpoint | Trigger | Output |
|----------|---------|--------|
| `GET /api/market/ai-summary` | Dashboard load | Daily market briefing |
| `GET /api/market/ai-insight` | Market page ticker search | Single-stock outlook |
| `POST /api/market/ai-portfolio-analysis` | Portfolio page button | Health score + rebalancing suggestions |
| `GET /api/market/ai-forecast-commentary` | Forecast page | Explains Prophet prediction |
| `GET /api/market/ai-watchlist-scores` | Watchlist page button | Batch conviction scores |
| `POST /api/analytics/backtest` (embedded) | Backtest run | Strategy evaluation summary |
| `POST /api/analytics/optimize` (embedded) | Optimizer run | Portfolio allocation recommendation |

---

## ML Pipeline

### Price Forecasting
Facebook **Prophet** trained on yfinance OHLCV history. Returns predicted price + upper/lower confidence intervals for 7, 30, or 90 days. Falls back to **scikit-learn Polynomial Ridge** regression if Prophet fails (e.g., insufficient data).

### Sentiment Analysis
VADER NLP scores yfinance news headlines for the ticker. Aggregates compound scores into a Bullish / Bearish / Neutral signal with a confidence percentage.

### Risk Metrics
- **Sharpe Ratio**: `(Rp - Rf) / σp` annualized
- **VaR 95 / VaR 99**: Historical simulation on daily returns
- **Maximum Drawdown**: Peak-to-trough percentage decline
- **Beta / Alpha**: Covariance vs SPY benchmark

### Backtesting Engine
Walk-forward simulation — no look-ahead bias. Four strategies:

| Strategy | Signal logic |
|----------|-------------|
| SMA Crossover | Buy when fast SMA crosses above slow SMA; sell on cross below |
| RSI Mean-Reversion | Buy when RSI < oversold (30); sell when RSI > overbought (70) |
| Bollinger Bands | Buy on lower-band touch; sell on upper-band touch |
| MACD | Buy when MACD line crosses above signal line; sell on cross below |

Metrics reported: total return %, buy-and-hold return %, annualized return, annualized volatility, Sharpe ratio, max drawdown, win rate, total trades, profitable trades, average trade P&L.

### Efficient Frontier (Markowitz)
Monte Carlo simulation samples 3 000 random weight vectors. For each portfolio computes annualized expected return, volatility, and Sharpe ratio. Identifies:
- **Max-Sharpe portfolio** — best risk-adjusted return
- **Min-Variance portfolio** — lowest volatility
- **Equal-weight baseline** — naive benchmark

Also returns full asset correlation matrix for diversification analysis.

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create user account |
| POST | `/login` | Obtain JWT access token |
| GET | `/me` | Get current user profile |

### Market (`/api/market`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/quote/{ticker}` | Live stock quote |
| GET | `/quotes?tickers=` | Batch quotes |
| GET | `/history/{ticker}` | OHLCV history |
| GET | `/movers` | Top market movers |
| GET | `/forecast/{ticker}` | Prophet price forecast + AI commentary |
| GET | `/risk/{ticker}` | Risk metrics |
| GET | `/portfolio-risk` | Portfolio-level risk |
| GET | `/sentiment/{ticker}` | VADER sentiment |
| POST | `/ai-insight` | Single-stock AI analysis |
| GET | `/ai-summary` | Daily AI market briefing |
| POST | `/ai-portfolio-analysis` | Portfolio health check |
| POST | `/ai-forecast-commentary` | Forecast explanation |
| GET | `/ai-watchlist-scores` | Batch ticker scoring |

### Portfolio (`/api/portfolio`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List / create portfolios |
| GET/DELETE | `/{id}` | Get / delete portfolio |
| POST | `/{id}/holdings` | Add holding |
| DELETE | `/{id}/holdings/{hid}` | Remove holding |
| POST | `/{id}/transactions` | Record transaction |
| GET | `/{id}/transactions` | Transaction history |
| GET | `/{id}/valuation` | Live portfolio valuation |
| GET/POST | `/{id}/watchlist` | Manage watchlist |
| DELETE | `/{id}/watchlist/{ticker}` | Remove from watchlist |

### Analytics (`/api/analytics`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/backtest` | Run strategy backtest |
| POST | `/optimize` | Run Efficient Frontier optimizer |

---

## Project Structure

```
FinForesight/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── market.py
│   │   │   ├── portfolio.py
│   │   │   └── analytics.py        # Backtest + Optimizer endpoints
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings
│   │   │   ├── security.py         # bcrypt hash/verify
│   │   │   └── database.py         # SQLAlchemy engine
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   └── portfolio.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── portfolio.py
│   │   │   ├── market.py
│   │   │   └── analytics.py        # Backtest + Frontier schemas
│   │   ├── services/
│   │   │   ├── market_data.py      # yfinance wrapper
│   │   │   ├── forecasting.py      # Prophet + Ridge fallback
│   │   │   ├── risk.py             # Sharpe, VaR, drawdown, beta
│   │   │   ├── sentiment.py        # VADER NLP
│   │   │   ├── ai_insights.py      # Claude API (5 functions)
│   │   │   ├── backtesting.py      # 4 strategy walk-forward engine
│   │   │   └── optimizer.py        # Monte Carlo Efficient Frontier
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_portfolio.py
│   │   └── test_risk.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/             # Sidebar, AppLayout
│   │   │   ├── ui/                 # Card, KPICard, Badge, Spinner, AIPanel
│   │   │   └── charts/
│   │   │       ├── PriceChart.tsx
│   │   │       ├── ForecastChart.tsx
│   │   │       ├── AllocationChart.tsx
│   │   │       ├── SentimentGauge.tsx
│   │   │       └── analytics/
│   │   │           ├── EquityCurveChart.tsx
│   │   │           └── FrontierChart.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── MarketPage.tsx
│   │   │   ├── ForecastPage.tsx
│   │   │   ├── PortfolioPage.tsx
│   │   │   ├── WatchlistPage.tsx
│   │   │   ├── AIInsightsPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── analytics/
│   │   │       ├── BacktestPage.tsx
│   │   │       └── OptimizerPage.tsx
│   │   ├── services/               # Axios API client layer
│   │   ├── store/                  # Zustand auth store
│   │   └── types/                  # TypeScript interfaces
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
cp .env.example .env           # Add ANTHROPIC_API_KEY (optional — AI features degrade gracefully without it)
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

### Docker (full stack)
```bash
docker-compose up --build      # Backend: 8000, Frontend: 3000
```

### API Docs
Visit `http://localhost:8000/docs` for interactive Swagger UI once the backend is running.

---

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...   # Optional — AI features disabled if absent
SECRET_KEY=your_jwt_secret
DATABASE_URL=sqlite:///./finforesight.db
ENVIRONMENT=development
```

---

## Author

**Ushasri Dasari** — MS Software Engineering
