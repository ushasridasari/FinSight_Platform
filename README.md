# FinForesight (FinSight Platform)

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude-API-orange?style=flat)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat&logo=vercel&logoColor=white)

**A full-stack web app for tracking stocks and portfolios, where the analysis part is done by the Claude API**

**Live demo:** [https://finforesight-azure.vercel.app](https://finforesight-azure.vercel.app)

</div>

---

## About the project

FinForesight is a stock and portfolio analysis app which I built with FastAPI in the backend and React + TypeScript in the frontend.

You can create an account, make portfolios, add holdings and transactions, keep a watchlist, and see live prices. On top of that, there are AI features: price forecast, news sentiment, a daily market briefing, a portfolio health check, risk explanation in simple words, and AI based portfolio allocation. There are also some normal quant tools like backtesting and an efficient frontier optimizer.

### Why I made it like this

In my first version I used normal ML models (Prophet for forecasting and VADER for sentiment). They worked, but the results felt very fixed and not connected to what is happening in the market right now. So I changed the design. Now the backend collects real market data at the time of the request (prices, news, ratios) and sends it to Claude with a clear prompt, and Claude gives back the analysis in JSON format.

The numbers like Sharpe ratio, VaR and drawdown are still calculated by my own code with NumPy and pandas. Claude only explains them. I did this because I wanted the maths to be exact and not depend on a language model.

> **Note:** This is a learning project. Nothing in this app is financial advice.

---

## Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [How the AI part works](#how-the-ai-part-works)
4. [Tech stack](#tech-stack)
5. [Pages in the app](#pages-in-the-app)
6. [How to run it](#how-to-run-it)
7. [Project structure](#project-structure)
8. [API endpoints](#api-endpoints)
9. [Some implementation details](#some-implementation-details)
10. [Problems I faced](#problems-i-faced)
11. [Tests](#tests)
12. [Deployment](#deployment)
13. [What I want to add next](#what-i-want-to-add-next)

---

## Features

### Basic features
| Feature | What it does |
|---------|--------------|
| **Login / Register** | JWT login, passwords hashed with bcrypt, protected pages |
| **Portfolios** | Create and delete portfolios, add holdings, record BUY/SELL transactions, see live profit and loss |
| **Market data** | Live quotes, price history (OHLCV) and top gainers/losers using yfinance |
| **Watchlist** | Save tickers and see their live price and an AI score |

### AI features (using Claude API)
| Feature | What it does |
|---------|--------------|
| **Price forecast** | Looks at the price history and gives a target price, trend, confidence, support/resistance levels and possible catalysts |
| **News sentiment** | Reads up to 20 recent news headlines for a ticker and says Bullish, Bearish or Neutral with a short reason |
| **Market briefing** | A daily summary of the market with headline, sector view, market mood and tickers to watch |
| **Portfolio health** | Checks your holdings for diversification and sector concentration, and suggests rebalancing |
| **Risk explanation** | Takes the risk numbers (Sharpe, VaR, drawdown, beta) and explains them in simple English with a grade from A to F |
| **AI portfolio builder** | You give a list of tickers and your goal, and it suggests weights for each one with a reason |
| **Watchlist scoring** | Gives every watchlist ticker a score from 1 to 10 and a Buy/Hold/Sell label |
| **Stock deep dive** | Full analysis of one stock: thesis, key factors, risk level and recommendation |

### Quant tools
| Feature | What it does |
|---------|--------------|
| **Backtesting** | Tests 5 strategies on past data: SMA crossover, RSI, Bollinger Bands, MACD, and an **AI Signal** strategy where Claude picks the buy/sell dates |
| **Efficient frontier** | Monte Carlo simulation with 3,000 random portfolios (by default) to find the max Sharpe and min variance portfolios |
| **Risk metrics** | Sharpe ratio, VaR 95/99, max drawdown, beta and alpha compared to SPY |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│   React 18 + TypeScript (Vite, Tailwind CSS, Recharts)       │
│   TanStack Query · Zustand · Axios (adds JWT to requests)    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────────────┐
│                      Backend (FastAPI)                       │
│   /api/auth  /api/market  /api/portfolio  /api/analytics     │
│   JWT check · CORS · Pydantic v2 validation                  │
└───────┬──────────────────────┬──────────────────────────────┘
        │                      │
┌───────▼───────┐    ┌─────────▼──────────────────────────────┐
│  SQLite DB    │    │           services/                     │
│  SQLAlchemy   │    │                                         │
│               │    │   market_data  (yfinance)               │
│  Users        │    │   ai_insights  (Claude prompts)         │
│  Portfolios   │    │   forecasting  (Claude)                 │
│  Holdings     │    │   sentiment    (Claude)                 │
│  Transactions │    │   risk         (NumPy / pandas)         │
│  Watchlists   │    │   backtesting  (5 strategies)           │
└───────────────┘    │   optimizer    (Monte Carlo)            │
                     └─────────────────┬───────────────────────┘
                                       │
                     ┌─────────────────▼───────────────────────┐
                     │   Outside services                       │
                     │   Claude API (claude-sonnet-4-6)         │
                     │   yfinance (prices + news)               │
                     └──────────────────────────────────────────┘
```

### Some design choices

- **Demo mode without API key:** If `ANTHROPIC_API_KEY` is not set, every AI endpoint still returns a proper response with a fallback message. So the app does not crash and you can still use all the non-AI parts.
- **Thin routes, logic in services:** The API files only handle the request and response. All the real logic is in `services/`, so it is easier to test.
- **Pydantic v2 schemas:** Every input and output is typed, so bad data is stopped at the API itself.
- **No look-ahead in backtesting:** On day `t`, the signal only uses data from before `t`.

---

## How the AI part works

There are 11 places in the backend where Claude is called. All of them have a fallback if the key is missing.

| # | What | Endpoint | What I send to Claude | What comes back |
|---|------|----------|-----------------------|-----------------|
| 1 | Market briefing | `GET /api/market/ai-summary` | SPY direction, top gainers and losers | Headline, themes, sector outlook, mood |
| 2 | Price forecast | `GET /api/market/forecast/{ticker}` | Last 60 days of close prices + some stats | Target price, trend, confidence %, levels, catalysts |
| 3 | News sentiment | `GET /api/market/sentiment/{ticker}` | Up to 20 news headlines | Label, score, short summary |
| 4 | Stock insight | `POST /api/market/ai-insight` | Quote, 52 week range, P/E, sector, risk numbers | Thesis, key factors, risk level, recommendation |
| 5 | Portfolio health | `POST /api/market/ai-portfolio-analysis` | All holdings with P&L, weight, sector | Grade, strengths, risks, actions per ticker |
| 6 | Watchlist scores | `GET /api/market/ai-watchlist-scores` | Quotes for all watchlist tickers | Score 1 to 10, Buy/Hold/Sell, one line reason |
| 7 | AI backtest signal | `POST /api/analytics/backtest` (strategy = `ai_signal`) | Monthly price history | Buy and sell dates |
| 8 | Backtest comment | `POST /api/analytics/backtest` | Final results (return, Sharpe, win rate) | Short review of the strategy |
| 9 | Optimizer comment | `POST /api/analytics/optimize` | Max Sharpe weights and stats | Recommendation |
| 10 | AI portfolio builder | `POST /api/analytics/ai-portfolio` | Fundamentals of each ticker + user goal | Weights, reason per stock, risk profile, how often to rebalance |
| 11 | Risk explanation | `GET /api/analytics/ai-risk/{ticker}` | Sharpe, VaR 95/99, drawdown, beta, alpha | Grade A to F, simple explanation, weight suggestion |

### How I write the prompts

Every prompt follows the same pattern:
1. **Give a role:** for example "you are a quantitative analyst" or "you are a risk analyst".
2. **Give clean data:** prices and numbers are sent as simple text tables.
3. **Ask for exact JSON:** the prompt shows the JSON shape I expect. The response is parsed with `_safe_json()`, and if parsing fails it uses a default object.
4. **Keep it short:** `max_tokens` is between 400 and 700 for each call, so the response comes fast.

---

## Tech stack

### Backend
| Tool | Version | Used for |
|------|---------|----------|
| Python | 3.11 | Runtime |
| FastAPI | 0.111 | REST API |
| SQLAlchemy | 2.0 | ORM |
| SQLite | | Database (can be changed to PostgreSQL later) |
| Pydantic v2 | 2.7 | Validation and settings |
| python-jose | 3.3 | JWT tokens |
| bcrypt | 4.2 | Password hashing |
| anthropic | 0.28 | Claude API client |
| yfinance | 0.2.40 | Prices, history and news |
| NumPy + pandas | | Risk maths and backtesting |
| Uvicorn | 0.30 | Server |

### Frontend
| Tool | Version | Used for |
|------|---------|----------|
| React | 18 | UI |
| TypeScript | 5 | Types |
| Vite | 5 | Dev server and build |
| Tailwind CSS | 3 | Dark theme styling |
| Recharts | 2 | Charts |
| TanStack Query | 5 | API data caching and refetch |
| Zustand | 4 | Login state (saved in localStorage) |
| Axios | 1.7 | HTTP client, adds the token and logs out on 401 |
| React Router | 6 | Pages and route protection |
| lucide-react | | Icons |

### Infrastructure
| Tool | Used for |
|------|----------|
| Docker + Docker Compose | Running backend and frontend together |
| Nginx | Serving the built frontend |
| Vercel | Frontend hosting |
| Render / Railway | Config files are ready for the backend |

---

## Pages in the app

| Page | Route | What you can see |
|------|-------|------------------|
| Dashboard | `/` | AI market briefing, SPY chart, top movers |
| Market | `/market` | Search a ticker, see quote, chart, risk numbers, sentiment gauge and AI analysis |
| Forecast | `/forecast` | AI price forecast with confidence band, trend, levels and catalysts |
| Portfolio | `/portfolio` | Holdings, live P&L, allocation chart, transactions, AI health check |
| Watchlist | `/watchlist` | Saved tickers with live prices and AI scores |
| AI Insights | `/ai-insights` | Deep analysis of one stock, you can also add your own context |
| Backtest | `/backtest` | Equity curve vs buy and hold, trade list, 10 performance numbers |
| Optimizer | `/optimizer` | Efficient frontier chart, best portfolio weights, correlation matrix |
| AI Portfolio | `/ai-portfolio` | AI suggested allocation with a reason for each stock |
| AI Risk | `/ai-risk` | Risk grade, numbers, and the AI explanation |

There are also `/login` and `/register` pages.

---

## How to run it

### You need
- Python 3.11 or higher
- Node.js 18 or higher
- An Anthropic API key, if you want the AI features ([console.anthropic.com](https://console.anthropic.com/)). Without it the app still runs in demo mode.

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
# open .env and set:
#   ANTHROPIC_API_KEY=your key
#   SECRET_KEY=any long random string

uvicorn app.main:app --reload --port 8000
```

Then open `http://localhost:8000/docs` to see the Swagger page with all endpoints.

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

The Vite dev server sends all `/api/*` calls to `localhost:8000`, so you don't need to change anything.

### With Docker

```bash
cp backend/.env.example backend/.env
# set ANTHROPIC_API_KEY and SECRET_KEY in backend/.env

docker-compose up --build
# Backend:  http://localhost:8000
# Frontend: http://localhost  (port 80)
```

### Environment variables

```env
# backend/.env
ANTHROPIC_API_KEY=...               # needed for AI features
SECRET_KEY=your-random-secret       # used to sign JWT
DATABASE_URL=sqlite:///./finforesight.db
ENVIRONMENT=development
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALGORITHM=HS256
```

---

## Project structure

```
FinSight_Platform/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py            # register, login, /me
│   │   │   ├── market.py          # quotes, history, forecast, sentiment, AI endpoints
│   │   │   ├── portfolio.py       # portfolios, holdings, transactions, watchlist
│   │   │   └── analytics.py       # backtest, optimizer, AI portfolio, AI risk
│   │   ├── core/
│   │   │   ├── config.py          # settings from .env
│   │   │   ├── security.py        # bcrypt + JWT
│   │   │   └── database.py        # SQLAlchemy engine and session
│   │   ├── models/                # User, Portfolio, Holding, Transaction, Watchlist
│   │   ├── schemas/               # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── market_data.py     # yfinance wrapper
│   │   │   ├── forecasting.py     # AI price forecast
│   │   │   ├── sentiment.py       # AI news sentiment
│   │   │   ├── risk.py            # Sharpe, VaR, drawdown, beta
│   │   │   ├── ai_insights.py     # most of the Claude prompts
│   │   │   ├── backtesting.py     # 5 strategies, including AI signal
│   │   │   └── optimizer.py       # Monte Carlo efficient frontier
│   │   └── main.py                # app setup, CORS, routers
│   ├── tests/                     # auth, portfolio and risk tests
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml / railway.json / Procfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, AppLayout
│   │   │   ├── ui/                # Card, KPICard, Badge, Spinner, AIPanel
│   │   │   └── charts/            # price, forecast, allocation, sentiment, equity curve, frontier
│   │   ├── pages/                 # all pages (+ analytics/ folder)
│   │   ├── services/              # API calls with Axios
│   │   ├── store/                 # Zustand auth store
│   │   └── types/                 # TypeScript types for API data
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## API endpoints

All endpoints except register and login need the JWT token.

### Auth (`/api/auth`)
| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/register` | Create account (email, username, password) |
| POST | `/login` | Login with form data, returns JWT token |
| GET | `/me` | Get the logged in user |

### Market (`/api/market`)
| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/quote/{ticker}` | Live quote |
| GET | `/quotes?tickers=` | Many quotes at once (comma separated) |
| GET | `/history/{ticker}` | Price history |
| GET | `/movers` | Top gainers and losers |
| GET | `/forecast/{ticker}` | AI price forecast |
| GET | `/risk/{ticker}` | Risk numbers for one stock |
| GET | `/portfolio-risk` | Risk for a set of tickers and weights |
| GET | `/sentiment/{ticker}` | AI news sentiment |
| POST | `/ai-insight` | AI deep dive for one stock |
| GET | `/ai-summary` | AI market briefing |
| POST | `/ai-portfolio-analysis` | AI portfolio health check |
| GET | `/ai-watchlist-scores` | AI scores for watchlist |

### Portfolio (`/api/portfolio`)
| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/` | List my portfolios |
| POST | `/` | Create a portfolio |
| DELETE | `/{portfolio_id}` | Delete a portfolio |
| POST | `/{portfolio_id}/holdings` | Add a holding |
| DELETE | `/{portfolio_id}/holdings/{holding_id}` | Remove a holding |
| POST | `/{portfolio_id}/transactions` | Add a BUY/SELL transaction |
| GET | `/{portfolio_id}/transactions` | List transactions |
| GET | `/{portfolio_id}/valuation` | Live value and P&L for each holding |
| GET | `/watchlist` | Get my watchlist |
| POST | `/watchlist` | Add a ticker to watchlist |
| DELETE | `/watchlist/{watchlist_id}` | Remove from watchlist |

### Analytics (`/api/analytics`)
| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/backtest` | Run a backtest (5 strategies) |
| POST | `/optimize` | Efficient frontier |
| POST | `/ai-portfolio` | AI portfolio weights |
| GET | `/ai-risk/{ticker}` | AI risk explanation and grade |

---

## Some implementation details

### Backtesting without cheating
The backtest goes day by day in order. The signal on day `t` uses only data until `t-1`. For the AI Signal strategy, I send only past monthly closing prices to Claude, so it cannot see the future. The result is always compared with simple buy and hold, so you can see if the strategy is really better.

### Efficient frontier
The optimizer makes 3,000 random sets of weights (with a fixed seed, so the result is same every time). For each one it calculates yearly return (mean × 252), volatility (std × √252) and Sharpe ratio. The max Sharpe and min variance portfolios are found in the same loop. It also returns the correlation matrix, so you can see which stocks move together.

### Getting proper JSON from Claude
Every prompt asks for **only JSON** and shows the exact format. Sometimes the model still adds markdown or extra text, so `_safe_json()` tries to parse it and if it fails, it returns a default object with the right shape. Because of this, a bad AI reply does not give a 500 error to the user.

### yfinance column issue
In some environments, yfinance 0.2.40 returns MultiIndex columns even for a single ticker. Then later code fails with `TypeError: float() argument must be ... not 'Series'`. I added `_flatten_columns()` in `market_data.py` which fixes the columns as soon as the data comes in.

### Login flow
I use bcrypt directly (not passlib) because passlib had problems with Python 3.13. JWT uses HS256. The frontend keeps the token in a Zustand store saved in localStorage, and an Axios interceptor adds it to every request. If the backend returns 401, the user is logged out and sent to the login page.

---

## Problems I faced

| Problem | How I fixed it |
|---------|----------------|
| passlib was not working with bcrypt on Python 3.13 | Removed passlib and used `bcrypt.hashpw` / `bcrypt.checkpw` directly |
| yfinance MultiIndex columns breaking number conversion | Added `_flatten_columns()` when the data is loaded |
| AI endpoints crashing when the key in `.env` was still the placeholder | `_ai_available()` checks the key starts with `sk-` and is not the placeholder text |
| Claude sometimes returning JSON inside markdown, or not JSON | `_safe_json()` with a safe default for every call |
| AI backtest was slow with daily data | Changed to monthly prices, so it sends only around 24 rows |
| Port already in use when restarting backend on Windows | Found and stopped the old process with PowerShell `Get-Process` |
| TypeScript build errors on Vercel for `import.meta.env` | Added `vite-env.d.ts` |

---

## Tests

Backend tests are in `backend/tests/` and use pytest:

- `test_auth.py`: register, login and token checks (6 tests)
- `test_portfolio.py`: portfolio, holding and transaction APIs (7 tests)
- `test_risk.py`: risk calculations (6 tests)

```bash
cd backend
pytest
```

---

## Deployment

| Part | Where | Link |
|------|-------|------|
| Frontend | Vercel | [finforesight-azure.vercel.app](https://finforesight-azure.vercel.app) |
| Backend | Render (free plan) | [finsight-backend-v0ni.onrender.com](https://finsight-backend-v0ni.onrender.com/docs) |

### Frontend on Vercel
The frontend in `frontend/` is deployed with the Vercel CLI. Page routing is handled by rewrites in `frontend/vercel.json`. The `VITE_API_URL` variable tells the frontend where the backend is. In Vercel it is set to `https://finsight-backend-v0ni.onrender.com`.

```bash
cd frontend
vercel deploy --prod
```

### Backend
I added `render.yaml` (Render), `railway.json` (Railway) and a `Procfile`. They all start the app with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The live backend runs on Render free plan, with root directory `backend`, `PYTHON_VERSION=3.11.9`, and `SECRET_KEY` set in Render settings. `ANTHROPIC_API_KEY` is optional, without it the AI parts show a fallback message. The backend CORS already allows the Vercel domain.

Some things to know about the free plan:
- The backend sleeps after about 15 minutes with no traffic. First request after that can take around 50 seconds.
- The database is SQLite, so accounts and portfolios are reset when the service restarts or redeploys.
- Yahoo blocks some requests from cloud servers, so company name, P/E and sector can be empty on the live site. Prices still work.

You can also run the backend locally:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

---

## What I want to add next

| Idea | Details |
|------|---------|
| **PostgreSQL** | Move from SQLite so many users can use it at the same time |
| **Live prices with WebSocket** | Update prices and P&L without refreshing |
| **Alerts** | Price alerts and email/webhook notifications |
| **Options tools** | Black-Scholes pricing, implied volatility, Greeks |
| **Shared portfolios** | Share portfolios and watchlists with other users |
| **PDF reports** | Download a portfolio report as PDF |
| **Mobile app** | React Native app using the same backend |

---

## Author

**Ushasri Dasari**, MS Software Engineering

If you have any feedback or find a bug, please open an issue. Thank you for checking my project!
