from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import yfinance as yf
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..services.stock_service import get_yf_symbol

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/", response_model=List[schemas.PortfolioOut])
def get_portfolios(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.id).all()


@router.post("/", response_model=schemas.PortfolioOut)
def create_portfolio(
    portfolio_data: schemas.PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    portfolio = models.Portfolio(user_id=current_user.id, name=portfolio_data.name)
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.get("/{portfolio_id}", response_model=schemas.PortfolioOut)
def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio


@router.post("/{portfolio_id}/holdings", response_model=schemas.HoldingOut)
def add_holding(
    portfolio_id: int,
    holding_data: schemas.HoldingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    holding = models.Holding(portfolio_id=portfolio_id, **holding_data.model_dump())
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{portfolio_id}/holdings/{holding_id}")
def remove_holding(
    portfolio_id: int,
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    holding = db.query(models.Holding).join(models.Portfolio).filter(
        models.Holding.id == holding_id,
        models.Holding.portfolio_id == portfolio_id,
        models.Portfolio.user_id == current_user.id
    ).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(holding)
    db.commit()
    return {"message": "Holding removed"}


@router.get("/{portfolio_id}/performance")
def portfolio_performance(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    holdings_data = []
    total_invested = 0
    total_current = 0
    sector_allocation = {}

    for h in portfolio.holdings:
        try:
            yf_sym = get_yf_symbol(h.symbol, h.exchange)
            ticker = yf.Ticker(yf_sym)
            info = ticker.fast_info
            current_price = float(info.last_price or h.avg_price)
            invested = h.quantity * h.avg_price
            current = h.quantity * current_price
            pnl = current - invested
            pnl_pct = (pnl / invested * 100) if invested > 0 else 0

            full_info = ticker.info
            sector = full_info.get("sector", "Other")
            sector_allocation[sector] = sector_allocation.get(sector, 0) + current

            total_invested += invested
            total_current += current

            holdings_data.append({
                "id": h.id,
                "symbol": h.symbol,
                "exchange": h.exchange,
                "quantity": h.quantity,
                "avg_price": h.avg_price,
                "current_price": round(current_price, 2),
                "invested": round(invested, 2),
                "current_value": round(current, 2),
                "pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 2),
                "sector": sector,
            })
        except Exception:
            holdings_data.append({
                "id": h.id,
                "symbol": h.symbol,
                "exchange": h.exchange,
                "quantity": h.quantity,
                "avg_price": h.avg_price,
                "current_price": h.avg_price,
                "invested": h.quantity * h.avg_price,
                "current_value": h.quantity * h.avg_price,
                "pnl": 0,
                "pnl_pct": 0,
                "sector": "Unknown",
            })

    overall_pnl = total_current - total_invested
    overall_pnl_pct = (overall_pnl / total_invested * 100) if total_invested > 0 else 0

    return {
        "portfolio_id": portfolio_id,
        "name": portfolio.name,
        "holdings": holdings_data,
        "total_invested": round(total_invested, 2),
        "total_current": round(total_current, 2),
        "total_pnl": round(overall_pnl, 2),
        "total_pnl_pct": round(overall_pnl_pct, 2),
        "sector_allocation": sector_allocation,
    }
