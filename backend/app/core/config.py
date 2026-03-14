"""
app/core/config.py — Centralised settings using pydantic-settings
"""

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List


class Settings(BaseSettings):
    APP_NAME:      str = "Used Car Price Prediction API"
    APP_VERSION:   str = "1.0.0"
    DEBUG:         bool = False

    # CORS — override with comma-separated origins in .env
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database
    DATABASE_URL: str = "sqlite:///./predictions.db"

    # ML Artifacts
    MODEL_PATH:    Path = Path("backend/ml/artifacts/car_price_model.pkl")
    FEATURES_PATH: Path = Path("backend/ml/artifacts/feature_config.json")
    METADATA_PATH: Path = Path("backend/ml/artifacts/model_metadata.json")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
