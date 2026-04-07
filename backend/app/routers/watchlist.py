from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("/", response_model=List[schemas.WatchlistOut])
def get_watchlists(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Watchlist).filter(models.Watchlist.user_id == current_user.id).all()


@router.post("/", response_model=schemas.WatchlistOut)
def create_watchlist(
    data: schemas.WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    wl = models.Watchlist(user_id=current_user.id, name=data.name)
    db.add(wl)
    db.commit()
    db.refresh(wl)
    return wl


@router.post("/{watchlist_id}/items", response_model=schemas.WatchlistItemOut)
def add_item(
    watchlist_id: int,
    item: schemas.WatchlistItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    wl = db.query(models.Watchlist).filter(
        models.Watchlist.id == watchlist_id,
        models.Watchlist.user_id == current_user.id
    ).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    existing = db.query(models.WatchlistItem).filter(
        models.WatchlistItem.watchlist_id == watchlist_id,
        models.WatchlistItem.symbol == item.symbol.upper(),
        models.WatchlistItem.exchange == item.exchange,
    ).first()
    if existing:
        return existing

    wl_item = models.WatchlistItem(
        watchlist_id=watchlist_id,
        symbol=item.symbol.upper(),
        exchange=item.exchange,
    )
    db.add(wl_item)
    db.commit()
    db.refresh(wl_item)
    return wl_item


@router.delete("/{watchlist_id}/items/{item_id}")
def remove_item(
    watchlist_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.WatchlistItem).join(models.Watchlist).filter(
        models.WatchlistItem.id == item_id,
        models.WatchlistItem.watchlist_id == watchlist_id,
        models.Watchlist.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed"}


@router.get("/{watchlist_id}/live-prices")
def live_prices(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    wl = db.query(models.Watchlist).filter(
        models.Watchlist.id == watchlist_id,
        models.Watchlist.user_id == current_user.id
    ).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    from ..services.stock_service import get_stock_quote
    prices = []
    for item in wl.items:
        try:
            q = get_stock_quote(item.symbol, item.exchange)
            prices.append(q)
        except Exception:
            prices.append({"symbol": item.symbol, "exchange": item.exchange, "price": 0})
    return prices
