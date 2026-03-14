"""
app/api/car_routes.py — REST endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
import json
from pathlib import Path

from app.schemas.car_schema import CarPredictionRequest, PredictionResponse, ModelInfoResponse
from app.services.prediction_service import predict_price
from app.models.car_model import model_manager
from app.database.db import get_db, PredictionLog
from app.core.config import settings

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK,
             summary="Predict used car resale price")
async def predict(payload: CarPredictionRequest, db: Session = Depends(get_db)):
    try:
        return predict_price(payload.model_dump(), db)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@router.get("/predictions", response_model=List[PredictionResponse], summary="Prediction history")
async def get_predictions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    logs = db.query(PredictionLog).order_by(PredictionLog.created_at.desc()).offset(offset).limit(limit).all()
    return [
        PredictionResponse(
            predicted_price  = log.predicted_price,
            price_range_low  = round(log.predicted_price * 0.90, 2),
            price_range_high = round(log.predicted_price * 1.10, 2),
            confidence_label = log.confidence or "Medium",
            prediction_id    = log.id,
            created_at       = log.created_at,
        ) for log in logs
    ]


@router.get("/predictions/{prediction_id}", summary="Single prediction")
async def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    log = db.query(PredictionLog).filter(PredictionLog.id == prediction_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    return log


@router.get("/model/info", response_model=ModelInfoResponse, summary="Model metadata")
async def model_info():
    try:
        return ModelInfoResponse(**model_manager.metadata)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/model/feature-importance", summary="Feature importance scores")
async def feature_importance():
    importance_path = Path(settings.MODEL_PATH).parent / "feature_importance.json"
    if not importance_path.exists():
        raise HTTPException(status_code=404, detail="Feature importance not found. Retrain the model.")
    with open(importance_path) as f:
        return json.load(f)

@router.get("/stats", summary="Aggregate prediction statistics")
async def prediction_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total = db.query(func.count(PredictionLog.id)).scalar()
    avg   = db.query(func.avg(PredictionLog.predicted_price)).scalar()
    max_p = db.query(func.max(PredictionLog.predicted_price)).scalar()
    min_p = db.query(func.min(PredictionLog.predicted_price)).scalar()
    return {
        "total_predictions": total or 0,
        "average_price":     round(avg or 0, 2),
        "max_price":         round(max_p or 0, 2),
        "min_price":         round(min_p or 0, 2),
    }


@router.get("/model/features", summary="Feature importance for charts")
async def feature_importance():
    import json
    from pathlib import Path
    importance_path = Path("ml/artifacts/feature_importance.json")
    if not importance_path.exists():
        raise HTTPException(status_code=404, detail="Feature importance not found. Retrain the model.")
    with open(importance_path) as f:
        data = json.load(f)
    return {
        "features":    list(data.keys()),
        "importances": list(data.values()),
    }
