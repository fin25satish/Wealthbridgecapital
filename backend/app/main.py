from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models  # noqa: F401 — must be imported before create_all
from .routers import auth, stocks, portfolio, watchlist, alerts

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="InvestIQ — Investment Research Platform",
    description="Aggregated India + USA stock research, backtesting, portfolio tracking",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(stocks.router)
app.include_router(portfolio.router)
app.include_router(watchlist.router)
app.include_router(alerts.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "InvestIQ API"}
