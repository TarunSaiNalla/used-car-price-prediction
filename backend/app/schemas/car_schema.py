"""
app/schemas/car_schema.py — Pydantic request & response models
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime
from enum import Enum


class FuelType(str, Enum):
    petrol    = "Petrol"
    diesel    = "Diesel"
    cng       = "CNG"
    lpg       = "LPG"
    electric  = "Electric"
    hybrid    = "Hybrid"


class TransmissionType(str, Enum):
    manual    = "Manual"
    automatic = "Automatic"


class SellerType(str, Enum):
    dealer    = "Dealer"
    individual = "Individual"
    trustmark = "Trustmark Dealer"


class OwnerType(str, Enum):
    first_owner       = "First Owner"
    second_owner      = "Second Owner"
    third_owner       = "Third Owner"
    fourth_owner      = "Fourth & Above Owner"
    test_drive        = "Test Drive Car"


# ─── Input Schema ─────────────────────────────────────────────────────────────
class CarPredictionRequest(BaseModel):
    name:         str           = Field(..., min_length=2, max_length=100, example="Maruti Swift VXI")
    year:         int           = Field(..., ge=1990, le=datetime.now().year, example=2019)
    km_driven:    int           = Field(..., ge=0, le=1_000_000, example=45000)
    fuel:         FuelType      = Field(..., example="Petrol")
    seller_type:  SellerType    = Field(..., example="Individual")
    transmission: TransmissionType = Field(..., example="Manual")
    owner:        OwnerType     = Field(..., example="First Owner")
    mileage:      Optional[float] = Field(None, ge=0, le=100, example=21.4,
                                          description="km/l or km/kg")
    engine:       Optional[float] = Field(None, ge=100, le=10000, example=1197,
                                          description="Engine displacement in CC")
    max_power:    Optional[float] = Field(None, ge=10, le=1000, example=81.8,
                                          description="Max power in bhp")
    seats:        Optional[int]  = Field(None, ge=2, le=14, example=5)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return v.strip()

    @model_validator(mode="after")
    def check_year_not_future(self):
        if self.year > datetime.now().year:
            raise ValueError("Manufacturing year cannot be in the future.")
        return self

    model_config = {"use_enum_values": True}


# ─── Response Schema ──────────────────────────────────────────────────────────
class PredictionResponse(BaseModel):
    predicted_price:     float = Field(..., description="Predicted resale price in INR")
    price_range_low:     float = Field(..., description="Lower bound (−10%)")
    price_range_high:    float = Field(..., description="Upper bound (+10%)")
    confidence_label:    str   = Field(..., description="Low / Medium / High")
    prediction_id:       int
    created_at:          datetime

    model_config = {"from_attributes": True}


class ModelInfoResponse(BaseModel):
    model_type:   str
    trained_at:   str
    r2:           float
    mae:          float
    rmse:         float
    mape:         float
    n_train:      int
