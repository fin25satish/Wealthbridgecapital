from .celery_app import celery_app
from .database import SessionLocal
from . import models
from .services.stock_service import get_stock_quote
from datetime import datetime


@celery_app.task
def check_price_alerts():
    db = SessionLocal()
    try:
        alerts = db.query(models.Alert).filter(models.Alert.is_active == True).all()
        for alert in alerts:
            try:
                quote = get_stock_quote(alert.symbol, alert.exchange)
                price = quote.get("price", 0)
                triggered = (
                    (alert.direction == "above" and price >= alert.target_price) or
                    (alert.direction == "below" and price <= alert.target_price)
                )
                if triggered:
                    alert.is_active = False
                    alert.triggered_at = datetime.utcnow()
                    db.commit()
            except Exception:
                pass
    finally:
        db.close()
