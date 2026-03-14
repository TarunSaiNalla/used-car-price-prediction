"""
app/services/prediction_service.py — Core prediction business logic
"""

import numpy as np
import logging
from sqlalchemy.orm import Session

from app.models.car_model import model_manager
from app.utils.data_preprocessing import preprocess_input
from app.database.db import PredictionLog

logger = logging.getLogger(__name__)

# Confidence thresholds based on car_age (simple heuristic)
def _confidence_label(car_age: int, km_driven: int) -> str:
    if car_age <= 5 and km_driven <= 80_000:
        return "High"
    elif car_age <= 10 and km_driven <= 150_000:
        return "Medium"
    return "Low"


def predict_price(request_data: dict, db: Session) -> dict:
    """
    1. Preprocess raw input into model-ready DataFrame
    2. Run prediction through the sklearn Pipeline
    3. Inverse-transform log prediction to actual INR
    4. Persist prediction log to DB
    5. Return structured result dict
    """
    feature_config = model_manager.feature_config
    pipeline       = model_manager.pipeline

    # ── Preprocess ────────────────────────────────────────────────────────
    X = preprocess_input(request_data, feature_config)

    # ── Predict (log scale) → invert to INR ──────────────────────────────
    log_pred        = pipeline.predict(X)[0]
    predicted_price = float(np.expm1(log_pred))

    # ── Confidence interval (±10% heuristic; replace with quantile regressors for prod) ──
    margin          = 0.10
    low             = predicted_price * (1 - margin)
    high            = predicted_price * (1 + margin)

    car_age   = int(request_data.get("car_age",   0))
    km_driven = int(request_data.get("km_driven", 0))
    confidence = _confidence_label(car_age, km_driven)

    # ── Persist to DB ─────────────────────────────────────────────────────
    log = PredictionLog(
        car_name        = request_data.get("name", ""),
        year            = request_data.get("year",  0) or (2024 - car_age),
        km_driven       = km_driven,
        fuel            = request_data.get("fuel", ""),
        transmission    = request_data.get("transmission", ""),
        seller_type     = request_data.get("seller_type", ""),
        owner           = request_data.get("owner", ""),
        predicted_price = round(predicted_price, 2),
        confidence      = confidence,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    logger.info(
        f"Prediction #{log.id}: {request_data.get('name')} → ₹{predicted_price:,.0f} [{confidence}]"
    )

    return {
        "predicted_price":  round(predicted_price, 2),
        "price_range_low":  round(low, 2),
        "price_range_high": round(high, 2),
        "confidence_label": confidence,
        "prediction_id":    log.id,
        "created_at":       log.created_at,
    }
