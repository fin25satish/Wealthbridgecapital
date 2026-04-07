from celery import Celery
from .config import settings

celery_app = Celery(
    "invest_platform",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-alerts-every-5-minutes": {
            "task": "app.tasks.check_price_alerts",
            "schedule": 300.0,
        },
    },
)
