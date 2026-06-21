# FinForesight — AI-Powered Financial Dashboard

> A full-stack financial analytics platform where Anthropic Claude AI is the sole intelligence layer — powering forecasting, sentiment, risk interpretation, portfolio construction, backtesting signals, and market insights.

## Overview

FinForesight is a graduate-level systems project built by an MS Software Engineering student. It demonstrates deep end-to-end AI integration using the Anthropic Claude API across a FastAPI backend and a React/TypeScript SPA — every analytical decision in the platform is driven by Claude, with yfinance providing raw market data and NumPy/pandas handling the math.

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
| Auth | JWT (python-jose), bcrypt |
| **AI** | **Anthropic Claude API (`claude-sonnet-4-6`) — sole intelligence layer** |
| Market Data | yfinance (OHLCV, quotes, news headlines) |
| Math / Data | NumPy, pandas (risk formulas, backtesting simulation) |
| Infrastructure | Docker, Docker Compose, Nginx (frontend), multi-stage builds |

> **No ML libraries.** Prophet, scikit-learn, VADER, and scipy have been removed. Claude AI replaced all of them.

---

## Pages & Features (10 pages)

| Page | Route | What Claude AI does |
|------|-------|-------------------|
| **Dashboard** | `/` | Generates a daily market briefing — headline, key themes, sector outlook, market mood |
| **Market** | `/market` | Auto-analyzes every ticker you search — investment thesis, risk level, recommendation |
| **Forecast** | `/forecast` | Reads 1 year of price history and predicts a target price, trend direction, confidence %, key support/resistance levels, and catalysts |
| **Portfolio** | `/portfolio` | "Run AI Portfolio Analysis" — health score, strengths, risks, per-holding rebalancing suggestions |
| **Watchlist** | `/watchlist` | "AI Score All" — batch conviction scores (1–10), Bullish/Bearish label, and action for every tracked ticker |
| **AI Insights** | `/ai-insights` | Deep single-stock analysis — paste any context, get outlook, key factors, risk level, and recommendation |
| **Backtest** | `/backtest` | 5 strategies including **AI Signal** — Claude reads price history and picks buy/sell dates itself |
| **Optimizer** | `/optimizer` | Monte Carlo Efficient Frontier — max-Sharpe, min-variance, equal-weight portfolios + Claude commentary |
| **AI Portfolio** | `/ai-portfolio` | Claude allocates weights for a basket of stocks with per-stock rationale, risk profile, rebalance frequency |
| **AI Risk** | `/ai-risk` | Computes Sharpe/VaR/drawdown/beta then Claude explains what they mean — letter grade A–F, key takeaways, portfolio weight guidance |

---

## AI Integration — Complete Map

All 10 Claude-powered functions, every one gracefully returns a fallback when `ANTHROPIC_API_KEY` is absent:

| Function | Endpoint | What Claude receives | What Claude returns |
|----------|----------|---------------------|-------------------|
| Daily market briefing | `GET /api/market/ai-summary` | SPY direction, top gainers/losers | Headline, themes, sector outlook, market mood |
| Price forecast | `GET /api/market/forecast/{ticker}` | 60-day close price CSV + period stats | Target price, trend, confidence, support/resistance, catalysts |
| News sentiment | `GET /api/market/sentiment/{ticker}` | Up to 20 news headlines | Bullish/Bearish/Neutral score + written summary |
| Single-stock insight | `POST /api/market/ai-insight` | Price, 52W range, P/E, sector, risk metrics | Investment thesis, key factors, risk level, recommendation |
| Portfolio health | `POST /api/market/ai-portfolio-analysis` | All holdings with P&L, weight, sector | Health grade, strengths, risks, per-ticker actions |
| Watchlist scoring | `GET /api/market/ai-watchlist-scores` | Live quotes for all watched tickers | Score 1–10, label, Buy/Hold/Sell action, reason |
| Backtest AI signal | `POST /api/analytics/backtest` (strategy=ai_signal) | Monthly price history | Optimal buy/sell dates → walk-forward trade signals |
| Backtest summary | `POST /api/analytics/backtest` | Final metrics (return, Sharpe, win rate) | Strategy evaluation commentary |
| Optimizer commentary | `POST /api/analytics/optimize` | Max-Sharpe weights + stats | Portfolio recommendation narrative |
| **AI Portfolio Construction** | `POST /api/analytics/ai-portfolio` | Live quotes for all tickers + user goals | Weight allocation, per-stock reasoning, risk profile, rebalance frequency |
| **AI Risk Interpretation** | `GET /api/analytics/ai-risk/{ticker}` | Sharpe, VaR, drawdown, beta, alpha | Risk grade A–F, plain-English explanation, portfolio weight guidance |

---

## Backtesting Engine

Walk-forward simulation — no look-ahead bias. Five strategies:

| Strategy | Signal logic |
|----------|-------------|
| **AI Signal (Claude)** | Claude reads monthly price history and identifies the optimal buy/sell dates |
| SMA Crossover | Buy when fast SMA crosses above slow SMA; sell on cross below |
| RSI Mean-Reversion | Buy when RSI < 30 (oversold); sell when RSI > 70 (overbought) |
| Bollinger Bands | Buy on lower-band touch; sell on upper-band touch |
| MACD | Buy when MACD line crosses above signal line; sell on cross below |

Metrics: total return %, buy-and-hold return %, annualized return, annualized volatility, Sharpe ratio, max drawdown, win rate, total trades, profitable trades, avg trade P&L.

---

## Efficient Frontier (Optimizer)

Monte Carlo simulation samples 3 000 random weight vectors. For each portfolio computes annualized expected return, volatility, and Sharpe ratio. Identifies:
- **Max-Sharpe portfolio** — best risk-adjusted return
- **Min-Variance portfolio** — lowest volatility
- **Equal-weight baseline** — naive benchmark
- Full asset **correlation matrix** for diversification analysis
- Claude AI commentary on the recommended allocation

---

## Risk Metrics (Math Layer)

These are computed as formulas, then explained by Claude AI:

- **Sharpe Ratio**: `(Rp - Rf) / σp` annualized
- **VaR 95 / VaR 99**: Historical simulation on daily returns
- **Maximum Drawdown**: Peak-to-trough percentage decline
- **Beta / Alpha**: Covariance vs SPY benchmark

---

## API Reference

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
| GET | `/forecast/{ticker}` | **Claude AI price forecast** |
| GET | `/risk/{ticker}` | Risk metrics (Sharpe, VaR, beta) |
| GET | `/portfolio-risk` | Portfolio-level risk |
| GET | `/sentiment/{ticker}` | **Claude AI news sentiment** |
| POST | `/ai-insight` | **Claude single-stock analysis** |
| GET | `/ai-summary` | **Claude daily market briefing** |
| POST | `/ai-portfolio-analysis` | **Claude portfolio health check** |
| GET | `/ai-watchlist-scores` | **Claude batch ticker scoring** |

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
| POST | `/backtest` | Run strategy backtest (incl. AI Signal) |
| POST | `/optimize` | Efficient Frontier + Claude commentary |
| POST | `/ai-portfolio` | **Claude AI portfolio weight allocation** |
| GET | `/ai-risk/{ticker}` | **Claude AI risk interpretation + grade** |

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
│   │   │   └── analytics.py          # Backtest, Optimizer, AI Portfolio, AI Risk
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic Settings
│   │   │   ├── security.py           # bcrypt hash/verify
│   │   │   └── database.py           # SQLAlchemy engine
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   └── portfolio.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── portfolio.py
│   │   │   ├── market.py
│   │   │   └── analytics.py          # Backtest, Frontier, AIPortfolio, AIRisk schemas
│   │   ├── services/
│   │   │   ├── market_data.py        # yfinance wrapper
│   │   │   ├── forecasting.py        # Claude AI price forecast
│   │   │   ├── sentiment.py          # Claude AI news sentiment
│   │   │   ├── risk.py               # Sharpe, VaR, drawdown, beta (math)
│   │   │   ├── ai_insights.py        # Claude API — 7 AI functions
│   │   │   ├── backtesting.py        # 5 strategies incl. Claude AI Signal
│   │   │   └── optimizer.py          # Monte Carlo Efficient Frontier
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_portfolio.py
│   │   └── test_risk.py
│   ├── requirements.txt              # FastAPI + yfinance + anthropic only
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # Sidebar (10 links), AppLayout
│   │   │   ├── ui/                   # Card, KPICard, Badge, Spinner, AIPanel
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
│   │   │       ├── AIPortfolioPage.tsx  # Claude portfolio construction
│   │   │       └── AIRiskPage.tsx       # Claude risk interpretation
│   │   ├── services/                 # Axios API client layer
│   │   ├── store/                    # Zustand auth store
│   │   └── types/                    # TypeScript interfaces
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
cp .env.example .env           # Set ANTHROPIC_API_KEY for AI features
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
Visit `http://localhost:8000/docs` for interactive Swagger UI.

---

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...   # Required for all AI features; app runs without it but AI returns fallback messages
SECRET_KEY=your_jwt_secret
DATABASE_URL=sqlite:///./finforesight.db
ENVIRONMENT=development
```

---

## Author

**Ushasri Dasari** — MS Software Engineering
