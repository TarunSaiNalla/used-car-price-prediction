"""
app/models/car_model.py — Singleton model loader & manager
"""

import joblib
import json
import logging
from pathlib import Path
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class ModelManager:
    """
    Singleton that loads the trained scikit-learn pipeline once at startup
    and exposes a predict() method for the service layer.
    """

    _instance:      Optional["ModelManager"] = None
    _pipeline       = None
    _feature_config: dict = {}
    _metadata:       dict = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load(self):
        model_path    = Path(settings.MODEL_PATH)
        features_path = Path(settings.FEATURES_PATH)
        metadata_path = Path(settings.METADATA_PATH)

        if not model_path.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {model_path}. "
                "Run `python backend/ml/train_model.py` first."
            )

        logger.info(f"Loading model from {model_path}")
        self._pipeline = joblib.load(model_path)

        with open(features_path) as f:
            self._feature_config = json.load(f)

        with open(metadata_path) as f:
            self._metadata = json.load(f)

        logger.info(
            f"Model loaded — R²={self._metadata.get('r2')} | "
            f"MAE=₹{self._metadata.get('mae'):,}"
        )

    @property
    def pipeline(self):
        if self._pipeline is None:
            self.load()
        return self._pipeline

    @property
    def feature_config(self) -> dict:
        if not self._feature_config:
            self.load()
        return self._feature_config

    @property
    def metadata(self) -> dict:
        if not self._metadata:
            self.load()
        return self._metadata


# Module-level singleton
model_manager = ModelManager()
