# InvestIQ — Full-Stack Investment Research Platform

A modern investment research platform for India (NSE/BSE) and USA (NYSE/NASDAQ) markets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL |
| Cache / Queue | Redis + Celery |
| Data | yfinance, Alpha Vantage, NewsAPI |
| Containerisation | Docker Compose |

## Features

- **Dashboard** — Live India + USA market indices, latest news
- **Stock Detail** — Price chart (1mo–5y), fundamentals, technicals, news
- **Backtesting Engine** — SMA Crossover, RSI, Bollinger Band, Momentum strategies with full equity curve + trade log
- **Stock Screener** — Filter by P/E, market cap, sector across NSE / S&P500
- **Portfolio Tracker** — Add holdings, live P&L, sector allocation pie chart
- **Watchlists** — Multiple lists with live prices
- **Price Alerts** — Above/below triggers checked every 5 min via Celery
- **News Feed** — Global + per-symbol news
- **Stock Comparison** — Normalised return chart + side-by-side metrics for up to 4 stocks
- **Auth** — JWT-based login / register, protected routes

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- (Optional) Alpha Vantage API key and NewsAPI key for richer data

### 1. Clone and configure
```bash
git clone <repo>
cd personal-website
```

Create a `.env` file in the project root (optional — defaults work for local dev):
```env
ALPHA_VANTAGE_API_KEY=your_key_here
NEWS_API_KEY=your_key_here
SECRET_KEY=change-me-in-production
```

### 2. Start all services
```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **FastAPI backend** on http://localhost:8000
- **Celery worker** (background price alert checker)
- **React frontend** on http://localhost:5173

### 3. Open the app
Navigate to **http://localhost:5173**

Register an account, log in, and start exploring.

## API Docs

FastAPI auto-generates interactive docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Get JWT token |
| GET | `/stocks/search?q=` | Search stocks |
| GET | `/stocks/{symbol}/quote` | Live quote |
| GET | `/stocks/{symbol}/history` | OHLCV history |
| GET | `/stocks/{symbol}/fundamentals` | PE, EPS, etc. |
| GET | `/stocks/{symbol}/technicals` | SMA, RSI, MACD, BB |
| POST | `/stocks/backtest` | Run backtest |
| GET | `/stocks/screen` | Screener |
| GET | `/portfolio/` | List portfolios |
| GET | `/watchlist/` | List watchlists |
| GET | `/alerts/` | List alerts |

## Project Structure

```
personal-website/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py          # FastAPI app
│       ├── models.py        # SQLAlchemy ORM
│       ├── schemas.py       # Pydantic schemas
│       ├── auth.py          # JWT utilities
│       ├── config.py        # Settings
│       ├── database.py      # DB session
│       ├── celery_app.py    # Celery config
│       ├── tasks.py         # Background tasks
│       ├── routers/         # API routers
│       └── services/        # Business logic
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.tsx
        ├── pages/           # All page components
        ├── components/      # Layout, StockSearch
        ├── store/           # Zustand auth store
        └── lib/             # api.ts, utils.ts
```

## Backtesting Strategies

| Strategy | Parameters |
|----------|-----------|
| SMA Crossover | fast_period (20), slow_period (50) |
| RSI Mean Reversion | rsi_period (14), oversold (30), overbought (70) |
| Bollinger Band Breakout | period (20), std_dev (2) |
| Momentum | lookback (20), hold_days (10) |

Metrics reported: Total Return %, CAGR, Sharpe Ratio, Max Drawdown, Win Rate, Trade Log, Equity Curve.

## Development (without Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
