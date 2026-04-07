from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from ..services.stock_service import (
    get_stock_quote, get_stock_history, get_stock_fundamentals,
    get_analyst_recommendations, search_stocks, get_market_overview,
    get_news_feed, get_technical_indicators, get_earnings_calendar, screen_stocks
)
from ..services.backtest_service import run_backtest
from ..schemas import BacktestRequest

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/search")
def search(q: str = Query(..., min_length=1), exchange: str = "ALL"):
    return search_stocks(q, exchange)


@router.get("/market-overview")
def market_overview():
    return get_market_overview()


@router.get("/news")
def news(symbol: Optional[str] = None):
    return get_news_feed(symbol)


@router.get("/screen")
def screener(
    exchange: str = "NSE",
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_market_cap: Optional[float] = None,
    sector: Optional[str] = None,
):
    return screen_stocks(exchange, min_pe, max_pe, min_market_cap, sector)


@router.get("/{symbol}/quote")
def quote(symbol: str, exchange: str = "NSE"):
    try:
        return get_stock_quote(symbol, exchange)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{symbol}/history")
def history(symbol: str, exchange: str = "NSE", period: str = "1y", interval: str = "1d"):
    try:
        return get_stock_history(symbol, exchange, period, interval)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{symbol}/fundamentals")
def fundamentals(symbol: str, exchange: str = "NSE"):
    try:
        return get_stock_fundamentals(symbol, exchange)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{symbol}/technicals")
def technicals(symbol: str, exchange: str = "NSE"):
    try:
        return get_technical_indicators(symbol, exchange)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{symbol}/recommendations")
def recommendations(symbol: str, exchange: str = "NSE"):
    try:
        return get_analyst_recommendations(symbol, exchange)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{symbol}/earnings")
def earnings(symbol: str, exchange: str = "NSE"):
    try:
        return get_earnings_calendar(symbol, exchange)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/backtest")
def backtest(req: BacktestRequest):
    result = run_backtest(
        symbol=req.symbol,
        exchange=req.exchange,
        strategy=req.strategy,
        start_date=req.start_date,
        end_date=req.end_date,
        initial_capital=req.initial_capital,
        params=req.params or {},
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
