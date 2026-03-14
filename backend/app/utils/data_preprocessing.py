"""
app/utils/data_preprocessing.py
Mirrors all feature engineering from train_model.py exactly.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

CURRENT_YEAR = datetime.now().year

LUXURY_BRANDS  = {"Bmw","Mercedes-Benz","Audi","Volvo","Jaguar","Land","Porsche","Lexus","Bentley","Maserati"}
POPULAR_BRANDS = {"Maruti","Hyundai","Honda","Tata","Mahindra","Toyota","Ford","Renault","Volkswagen","Kia"}


def preprocess_input(raw: dict, feature_config: dict) -> pd.DataFrame:
    data = raw.copy()

    year    = int(data.get("year", CURRENT_YEAR))
    car_age = CURRENT_YEAR - year

    # Age features
    data["car_age"]         = car_age
    data["car_age_squared"] = car_age ** 2
    data["car_age_cubed"]   = car_age ** 3

    # KM features
    km = float(data.get("km_driven", 0))
    km = min(km, 500_000)
    data["km_driven"]       = km
    data["km_per_year"]     = km / max(car_age, 1)
    data["km_driven_log"]   = np.log1p(km)
    data["km_per_year_log"] = np.log1p(data["km_per_year"])

    # Brand features
    name  = str(data.get("name", "")).strip()
    brand = name.split()[0].title() if name else "Unknown"
    data["brand"]           = brand
    data["is_luxury"]       = int(brand in LUXURY_BRANDS)
    data["is_popular_brand"] = int(brand in POPULAR_BRANDS)

    # Power ratio & interactions
    engine    = data.get("engine")
    max_power = data.get("max_power")
    mileage   = data.get("mileage")

    data["power_per_cc"]    = (max_power / engine) if (engine and max_power and engine > 0) else np.nan
    data["age_x_km"]        = car_age * data["km_driven_log"]
    data["mileage_x_power"] = (mileage or 0) * (max_power or 0)

    # Drop raw year
    data.pop("year", None)

    # Enum → string
    for k, v in data.items():
        if hasattr(v, "value"):
            data[k] = v.value

    # Build DataFrame with exact expected columns
    all_features = feature_config["num_features"] + feature_config["cat_features"]
    df = pd.DataFrame([data])
    for col in all_features:
        if col not in df.columns:
            df[col] = np.nan
    df = df[all_features]

    logger.debug(f"Preprocessed shape: {df.shape}")
    return df
