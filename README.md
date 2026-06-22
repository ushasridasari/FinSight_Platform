# FinForesight — AI-Powered Financial Intelligence Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude-AI-orange?style=flat)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)

**A production-grade full-stack financial analytics platform powered entirely by Anthropic Claude AI**

[Features](#features) · [Architecture](#system-architecture) · [AI Integration](#ai-integration) · [Tech Stack](#tech-stack) · [Setup](#setup--installation) · [API Reference](#api-reference)

</div>

---

## Project Overview

FinForesight is a full-stack financial intelligence platform that replaces traditional rule-based ML models with **Anthropic Claude AI** as the sole analytical intelligence layer. The platform provides real-time portfolio management, AI-driven price forecasting, sentiment analysis, backtesting, and portfolio optimization — all delivered through a modern React/TypeScript SPA backed by a FastAPI REST API.

This project demonstrates competency across the full software engineering stack: **RESTful API design**, **relational database modeling**, **real-time data pipelines**, **LLM prompt engineering**, **React component architecture**, and **containerized deployment** — skills directly applicable to software engineering roles in fintech, AI-product, and full-stack domains.

### What makes it different from typical projects

Most financial dashboards either use static ML models (Prophet, VADER) or display raw data. FinForesight replaces static models entirely with **dynamic AI reasoning** — Claude reads actual market data at request time and generates investment analysis, price forecasts, sentiment scores, risk interpretations, and portfolio allocations using contextual understanding rather than pattern matching. Every analytical output in the platform passes through Claude's API.

---

## Features

### Core Platform
| Feature | Description |
|---------|-------------|
| **Authentication** | JWT-based auth with bcrypt password hashing, token refresh, protected routes |
| **Portfolio Management** | Full CRUD for portfolios, holdings, and transaction history with live P&L |
| **Real-time Market Data** | Live quotes, OHLCV history, and market movers via yfinance integration |
| **Watchlist** | Track tickers with live prices and AI-generated conviction scores |

### AI-Powered Analytics (Claude AI)
| Feature | Description |
|---------|-------------|
| **AI Price Forecast** | Claude analyzes 1 year of OHLCV history and generates a price target, trend direction, confidence score, key support/resistance levels, and catalysts |
| **AI Sentiment Analysis** | Claude reads up to 20 live news headlines per ticker and returns a structured Bullish/Bearish/Neutral sentiment score with written rationale |
| **AI Market Briefing** | Daily AI-generated market summary with headline, sector outlooks, market mood, and tickers to watch |
| **AI Portfolio Health** | Claude evaluates your holdings for diversification, sector concentration, and rebalancing opportunities |
| **AI Risk Interpretation** | Computes Sharpe ratio, VaR, max drawdown, and beta — then Claude translates the numbers into plain-English investment guidance with a letter grade (A–F) |
| **AI Portfolio Construction** | Claude allocates weights across a user-supplied basket of tickers based on live fundamentals and stated investment goals |
| **AI Watchlist Scoring** | Batch conviction scoring (1–10) for every tracked ticker with Buy/Hold/Sell action |
| **AI Stock Deep-Dive** | Single-stock analysis with investment thesis, key factors, risk level, and recommendation |

### Quantitative Analytics
| Feature | Description |
|---------|-------------|
| **Backtesting Engine** | Walk-forward simulation across 5 strategies: SMA Crossover, RSI, Bollinger Bands, MACD, and **AI Signal** (Claude picks buy/sell dates) |
| **Efficient Frontier** | Markowitz portfolio optimization via 3,000-portfolio Monte Carlo simulation — identifies max-Sharpe, min-variance, and equal-weight portfolios |
| **Risk Metrics** | Sharpe ratio, VaR 95/99, maximum drawdown, beta, and alpha vs SPY benchmark |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│   React 18 + TypeScript SPA (Vite, Tailwind CSS, Recharts)  │
│   TanStack Query · Zustand · Axios (JWT interceptor)         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│                      API Layer (FastAPI)                      │
│   /api/auth  /api/market  /api/portfolio  /api/analytics     │
│   JWT middleware · CORS · Pydantic v2 validation             │
└───────┬──────────────────────┬──────────────────────────────┘
        │                      │
┌───────▼───────┐    ┌─────────▼──────────────────────────────┐
│  SQLite DB    │    │           Service Layer                  │
│  SQLAlchemy   │    │                                          │
│  ORM          │    │  ┌─────────────┐  ┌──────────────────┐  │
│               │    │  │ market_data │  │   ai_insights    │  │
│  Users        │    │  │ (yfinance)  │  │ (Claude API ×7)  │  │
│  Portfolios   │    │  └─────────────┘  └──────────────────┘  │
│  Holdings     │    │  ┌─────────────┐  ┌──────────────────┐  │
│  Transactions │    │  │ forecasting │  │    sentiment     │  │
│  Watchlists   │    │  │ (Claude AI) │  │  (Claude AI)     │  │
└───────────────┘    │  └─────────────┘  └──────────────────┘  │
                     │  ┌─────────────┐  ┌──────────────────┐  │
                     │  │    risk     │  │  backtesting     │  │
                     │  │(NumPy/pandas│  │ (5 strategies)   │  │
                     │  └─────────────┘  └──────────────────┘  │
                     │  ┌─────────────────────────────────────┐ │
                     │  │    optimizer (Monte Carlo EF)        │ │
                     │  └─────────────────────────────────────┘ │
                     └────────────────────────────────────────┘
                                        │
                     ┌──────────────────▼────────────────────┐
                     │         External Services              │
                     │  Anthropic Claude API (claude-sonnet-4-6)│
                     │  yfinance (market data + news)         │
                     └────────────────────────────────────────┘
```

### Design Decisions

- **AI-first analytics:** Instead of training static ML models (Prophet, VADER), the platform uses Claude's contextual reasoning at request time. This means forecasts and sentiment scores reflect current market context rather than historical training distributions.
- **Graceful degradation:** Every AI endpoint returns a structured fallback response when the API key is absent — the app runs fully in demo mode without an Anthropic key.
- **Service layer pattern:** Business logic lives in `services/`, keeping API routes thin. Each service is independently testable.
- **Pydantic v2 schemas:** All API inputs/outputs are strongly typed — runtime validation at the boundary prevents bad data from reaching the database or AI prompts.
- **Walk-forward backtesting:** No look-ahead bias — signals at date `t` only use data available before `t`.

---

## AI Integration

All 11 Claude-powered functions — every one degrades gracefully without an API key:

| # | Function | Endpoint | Claude receives | Claude returns |
|---|----------|----------|-----------------|----------------|
| 1 | Daily Market Briefing | `GET /api/market/ai-summary` | SPY direction, top gainers/losers | Headline, themes, sector outlook, market mood |
| 2 | Price Forecast | `GET /api/market/forecast/{ticker}` | 60-day close price CSV + period statistics | Target price, trend, confidence %, support/resistance levels, catalysts |
| 3 | News Sentiment | `GET /api/market/sentiment/{ticker}` | Up to 20 live news headlines | Bullish/Bearish/Neutral label, composite score, written summary |
| 4 | Stock Insight | `POST /api/market/ai-insight` | Live quote, 52W range, P/E, sector, risk metrics | Investment thesis, key factors, risk level, recommendation |
| 5 | Portfolio Health | `POST /api/market/ai-portfolio-analysis` | All holdings with P&L, weight, sector | Health grade, strengths, risks, per-ticker rebalancing actions |
| 6 | Watchlist Scoring | `GET /api/market/ai-watchlist-scores` | Live quotes for all watched tickers | Score 1–10, label, Buy/Hold/Sell, one-sentence reason |
| 7 | AI Backtest Signal | `POST /api/analytics/backtest` (strategy=ai_signal) | Monthly price history | Optimal buy/sell dates mapped to walk-forward signals |
| 8 | Backtest Commentary | `POST /api/analytics/backtest` | Final metrics (return, Sharpe, win rate) | Strategy evaluation narrative |
| 9 | Optimizer Commentary | `POST /api/analytics/optimize` | Max-Sharpe weights + expected stats | Portfolio construction recommendation |
| 10 | AI Portfolio Construction | `POST /api/analytics/ai-portfolio` | Live fundamentals for each ticker + user goals | Weight allocation, per-stock rationale, risk profile, rebalance frequency |
| 11 | AI Risk Interpretation | `GET /api/analytics/ai-risk/{ticker}` | Sharpe, VaR 95/99, drawdown, beta, alpha | Risk grade A–F, plain-English explanation, portfolio weight guidance |

### Prompt Engineering Approach

Each Claude prompt is structured with:
1. **Role priming** — Claude is assigned a specific financial role (quantitative analyst, portfolio manager, risk analyst)
2. **Structured data injection** — market data, prices, and metrics are formatted as clean text tables
3. **Output schema enforcement** — prompts specify exact JSON structure; responses are parsed with a `_safe_json()` fallback
4. **Token budgeting** — `max_tokens` is sized per function (400–700) to balance response quality vs latency

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.111 | REST API framework, async request handling |
| SQLAlchemy | 2.0 | ORM, database abstraction |
| SQLite | — | Relational storage (swappable to PostgreSQL) |
| Pydantic v2 | 2.7 | Request/response validation, settings management |
| python-jose | 3.3 | JWT token creation and verification |
| bcrypt | 4.2 | Password hashing (no passlib dependency) |
| anthropic | 0.28 | Claude API client |
| yfinance | 0.2.40 | Market data, OHLCV history, news headlines |
| NumPy + pandas | — | Risk formula computation, backtesting simulation |
| Uvicorn | 0.30 | ASGI server |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety across all components and services |
| Vite | 5 | Build tooling and dev server |
| Tailwind CSS | 3 | Utility-first dark-theme styling |
| Recharts | 2 | Financial charts (AreaChart, ComposedChart, ScatterChart, RadialBar, PieChart) |
| TanStack Query | 5 | Server state management, caching, background refetch |
| Zustand | 4 | Client state (persisted JWT auth store) |
| Axios | 1.7 | HTTP client with JWT interceptor and 401 auto-redirect |
| React Router | 6 | Client-side routing with auth guard |
| lucide-react | — | Icon library |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Multi-container orchestration |
| Nginx | Frontend static file serving with SPA fallback |
| Multi-stage Docker builds | Minimal production images |

---

## Application Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | AI market briefing, SPY chart, top movers |
| Market | `/market` | Ticker search with live quote, price chart, risk metrics, AI sentiment gauge, and auto-triggered AI analysis |
| Forecast | `/forecast` | Claude AI price forecast with confidence bands, trend direction, key price levels, and catalysts |
| Portfolio | `/portfolio` | Holdings management, live P&L, allocation chart, transaction history, AI health check |
| Watchlist | `/watchlist` | Tracked tickers with live prices and batch AI conviction scoring |
| AI Insights | `/ai-insights` | Deep single-stock analysis with custom context input |
| Backtest | `/backtest` | Strategy backtesting with equity curve vs buy-and-hold, trade log, 10 performance metrics |
| Optimizer | `/optimizer` | Efficient Frontier scatter plot, optimal portfolio weight breakdowns, correlation matrix |
| AI Portfolio | `/ai-portfolio` | Claude AI portfolio construction with allocation bars and per-stock rationale |
| AI Risk | `/ai-risk` | Risk grade (A–F), metrics grid, Claude plain-English interpretation |

---

## Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- An Anthropic API key (`sk-ant-...`) — [get one here](https://console.anthropic.com/)

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Open .env and set:
#   ANTHROPIC_API_KEY=sk-ant-your-key-here
#   SECRET_KEY=any-long-random-string

uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `localhost:8000`.

### Docker (Full Stack)

```bash
# Copy and configure environment
cp backend/.env.example backend/.env
# Set ANTHROPIC_API_KEY and SECRET_KEY in backend/.env

docker-compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

### Environment Variables

```env
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...        # Required for AI features
SECRET_KEY=your-random-secret       # JWT signing key
DATABASE_URL=sqlite:///./finforesight.db
ENVIRONMENT=development
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> **Without `ANTHROPIC_API_KEY`:** The app runs fully in demo mode. All AI endpoints return structured fallback messages instead of crashing — no feature is hard-blocked.

---

## Project Structure

```
FinForesight/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py            # Register, login, /me
│   │   │   ├── market.py          # Quotes, history, forecast, sentiment, AI endpoints
│   │   │   ├── portfolio.py       # Portfolio/holding/transaction/watchlist CRUD
│   │   │   └── analytics.py       # Backtest, Optimizer, AI Portfolio, AI Risk
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings (env-driven)
│   │   │   ├── security.py        # bcrypt + JWT
│   │   │   └── database.py        # SQLAlchemy engine, session, init
│   │   ├── models/
│   │   │   ├── user.py            # User ORM model
│   │   │   └── portfolio.py       # Portfolio, Holding, Transaction, Watchlist
│   │   ├── schemas/
│   │   │   ├── user.py            # UserCreate, UserOut, Token
│   │   │   ├── portfolio.py       # Portfolio/Holding/Transaction schemas
│   │   │   ├── market.py          # StockQuote, OHLCV, ForecastResponse, SentimentResult
│   │   │   └── analytics.py       # Backtest/Frontier/AIPortfolio/AIRisk schemas
│   │   ├── services/
│   │   │   ├── market_data.py     # yfinance wrapper, MultiIndex column flattening
│   │   │   ├── forecasting.py     # Claude AI price forecast
│   │   │   ├── sentiment.py       # Claude AI news sentiment
│   │   │   ├── risk.py            # Sharpe, VaR, drawdown, beta (NumPy)
│   │   │   ├── ai_insights.py     # Claude API — 7 AI functions, prompt templates
│   │   │   ├── backtesting.py     # 5 strategies incl. Claude AI Signal
│   │   │   └── optimizer.py       # Monte Carlo Efficient Frontier
│   │   └── main.py                # App factory, CORS, startup, router registration
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
│   │   │   ├── layout/            # Sidebar, AppLayout
│   │   │   ├── ui/                # Card, KPICard, Badge, Spinner, AIPanel
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
│   │   │       ├── OptimizerPage.tsx
│   │   │       ├── AIPortfolioPage.tsx
│   │   │       └── AIRiskPage.tsx
│   │   ├── services/              # Axios API client functions
│   │   ├── store/                 # Zustand auth store (localStorage persistence)
│   │   └── types/                 # TypeScript interfaces for all API shapes
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Create account with email, username, password |
| POST | `/login` | — | OAuth2 form login → JWT access token |
| GET | `/me` | ✅ | Get authenticated user profile |

### Market Data (`/api/market`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/quote/{ticker}` | ✅ | Live stock quote |
| GET | `/quotes?tickers=` | ✅ | Batch quotes (comma-separated) |
| GET | `/history/{ticker}` | ✅ | OHLCV history (period param) |
| GET | `/movers` | ✅ | Top market gainers and losers |
| GET | `/forecast/{ticker}` | ✅ | **Claude AI** price forecast + confidence bands |
| GET | `/risk/{ticker}` | ✅ | Sharpe, VaR 95/99, drawdown, beta, alpha |
| GET | `/portfolio-risk` | ✅ | Portfolio-level risk (tickers + weights params) |
| GET | `/sentiment/{ticker}` | ✅ | **Claude AI** news sentiment analysis |
| POST | `/ai-insight` | ✅ | **Claude AI** single-stock deep analysis |
| GET | `/ai-summary` | ✅ | **Claude AI** daily market briefing |
| POST | `/ai-portfolio-analysis` | ✅ | **Claude AI** portfolio health check |
| GET | `/ai-watchlist-scores` | ✅ | **Claude AI** batch ticker conviction scores |

### Portfolio (`/api/portfolio`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/` | ✅ | List / create portfolios |
| GET/DELETE | `/{id}` | ✅ | Get / delete portfolio |
| POST | `/{id}/holdings` | ✅ | Add holding |
| DELETE | `/{id}/holdings/{hid}` | ✅ | Remove holding |
| POST | `/{id}/transactions` | ✅ | Record BUY/SELL transaction |
| GET | `/{id}/transactions` | ✅ | Transaction history |
| GET | `/{id}/valuation` | ✅ | Live portfolio valuation with P&L per holding |
| GET/POST | `/{id}/watchlist` | ✅ | View / add watchlist tickers |
| DELETE | `/{id}/watchlist/{ticker}` | ✅ | Remove ticker from watchlist |

### Analytics (`/api/analytics`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/backtest` | ✅ | Run walk-forward backtest (5 strategies) |
| POST | `/optimize` | ✅ | Monte Carlo Efficient Frontier |
| POST | `/ai-portfolio` | ✅ | **Claude AI** portfolio weight allocation |
| GET | `/ai-risk/{ticker}` | ✅ | **Claude AI** risk interpretation + grade |

---

## Implementation Highlights

### Backtesting Engine — No Look-Ahead Bias
The backtesting simulator processes each trading day strictly in chronological order. Signals at time `t` are computed only from data available at `t-1` or earlier. The AI Signal strategy sends only historical monthly closes to Claude, preventing any forward-looking contamination. Performance is benchmarked against passive buy-and-hold to give a fair comparison baseline.

### Efficient Frontier via Monte Carlo
The optimizer samples 3,000 random portfolio weight vectors using NumPy's seeded random generator (reproducible). For each portfolio it computes annualized expected return (mean × 252), volatility (std × √252), and Sharpe ratio. The max-Sharpe and min-variance portfolios are identified in a single O(n) pass rather than a separate optimization loop. The full correlation matrix is returned alongside the scatter chart data for diversification analysis.

### Prompt Engineering for Structured Output
Every Claude call requests **raw JSON only** with a declared schema in the prompt body. A `_safe_json()` utility parses the response and falls back to a structurally valid default on parse failure — ensuring the API never returns a 500 from a malformed LLM response. Token budgets are kept tight (400–700 tokens) to minimize latency per request.

### yfinance MultiIndex Handling
yfinance 0.2.40 returns MultiIndex columns for single-ticker downloads in some environments. The `_flatten_columns()` utility in `market_data.py` detects and flattens these at the data ingestion boundary, preventing `TypeError: float() argument must be a string or a real number, not 'Series'` downstream.

### Auth Flow
Passwords are hashed with bcrypt directly (no passlib) to avoid Python 3.13 compatibility issues. JWT tokens use HS256 with configurable expiry. The frontend stores the token in Zustand's persisted store (localStorage) and injects it via an Axios request interceptor. A 401 response triggers automatic logout and redirect to login.

---

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| bcrypt + Python 3.13 passlib incompatibility | Dropped passlib entirely; use `bcrypt.hashpw/checkpw` directly |
| yfinance MultiIndex columns breaking downstream float casts | `_flatten_columns()` utility at the data ingestion boundary |
| AI endpoints crashing when placeholder key is set | `_ai_available()` validates `sk-` prefix and rejects placeholder strings |
| Claude returning non-JSON or markdown-wrapped JSON | `_safe_json()` with structurally valid fallback on every Claude call |
| Walk-forward backtest with AI signal latency | Monthly resampling reduces price history to ~24 rows per Claude call |
| Port conflicts on backend restart | Process detection by name using PowerShell `Get-Process` |

---

## Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Options Analytics** | Black-Scholes pricing, implied volatility surface, Greeks dashboard |
| **Multi-user Collaboration** | Shared portfolios, team watchlists, role-based access control |
| **Alert System** | Price alerts, AI-detected anomalies, email/webhook notifications |
| **PostgreSQL Migration** | Replace SQLite with PostgreSQL for concurrent production use |
| **WebSocket Streaming** | Real-time price ticks and live portfolio P&L updates |
| **Claude Extended Thinking** | Use Claude's extended thinking mode for deeper multi-step financial reasoning |
| **PDF Report Export** | AI-generated portfolio reports exportable as branded PDFs |
| **Mobile App** | React Native companion app using the same FastAPI backend |

---

## Author

**Ushasri Dasari**
MS Software Engineering

> *Built to demonstrate end-to-end software engineering proficiency: API design, database modeling, LLM integration, React architecture, and containerized deployment.*
