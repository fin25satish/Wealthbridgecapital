from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://invest_user:invest_pass@localhost:5432/invest_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALPHA_VANTAGE_API_KEY: str = "demo"
    NEWS_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
