from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# Portfolio
class HoldingCreate(BaseModel):
    symbol: str
    exchange: str = "NSE"
    quantity: float
    avg_price: float
    buy_date: Optional[datetime] = None
    notes: Optional[str] = None


class HoldingOut(HoldingCreate):
    id: int
    portfolio_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioCreate(BaseModel):
    name: str = "My Portfolio"


class PortfolioOut(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: datetime
    holdings: List[HoldingOut] = []

    class Config:
        from_attributes = True


# Watchlist
class WatchlistCreate(BaseModel):
    name: str = "My Watchlist"


class WatchlistItemCreate(BaseModel):
    symbol: str
    exchange: str = "NSE"


class WatchlistItemOut(BaseModel):
    id: int
    symbol: str
    exchange: str
    added_at: datetime

    class Config:
        from_attributes = True


class WatchlistOut(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: datetime
    items: List[WatchlistItemOut] = []

    class Config:
        from_attributes = True


# Alert
class AlertCreate(BaseModel):
    symbol: str
    exchange: str = "NSE"
    target_price: float
    direction: str  # "above" or "below"


class AlertOut(AlertCreate):
    id: int
    is_active: bool
    triggered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Saved Analysis
class SavedAnalysisCreate(BaseModel):
    symbol: str
    analysis_type: str
    config: Optional[Any] = None
    results: Optional[Any] = None


class SavedAnalysisOut(SavedAnalysisCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Stock
class StockSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: Optional[str] = None
    market_cap: Optional[float] = None


class BacktestRequest(BaseModel):
    symbol: str
    exchange: str = "NSE"
    strategy: str  # "sma_crossover", "rsi", "bollinger", "momentum"
    start_date: str
    end_date: str
    initial_capital: float = 100000.0
    params: Optional[dict] = None
