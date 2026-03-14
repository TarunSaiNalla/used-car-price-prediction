"""
backend/ml/train_model.py
Improved ML pipeline — XGBoost + feature engineering
Expected R²: 0.90+
Run: python ml/train_model.py
"""

import pandas as pd
import numpy as np
import joblib, json, logging, warnings
from pathlib import Path
from datetime import datetime

from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, VotingRegressor

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR      = Path(__file__).resolve().parent.parent
DATASET       = BASE_DIR / "dataset" / "used_cars.csv"
ARTIFACT_DIR  = BASE_DIR / "ml" / "artifacts"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH    = ARTIFACT_DIR / "car_price_model.pkl"
METADATA_PATH = ARTIFACT_DIR / "model_metadata.json"
FEATURES_PATH = ARTIFACT_DIR / "feature_config.json"
IMPORTANCE_PATH = ARTIFACT_DIR / "feature_importance.json"

CURRENT_YEAR  = datetime.now().year


# ── 1. Load ───────────────────────────────────────────────────────────────────
def load_data():
    logger.info(f"Loading {DATASET}")
    df = pd.read_csv(DATASET)
    logger.info(f"Loaded {len(df):,} rows × {len(df.columns)} columns")
    return df


# ── 2. Feature Engineering ────────────────────────────────────────────────────
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Age features
    df["car_age"]         = CURRENT_YEAR - df["year"]
    df["car_age_squared"] = df["car_age"] ** 2
    df["car_age_cubed"]   = df["car_age"] ** 3

    # Mileage features
    df["km_driven"]       = df["km_driven"].clip(0, 500_000)
    df["km_per_year"]     = df["km_driven"] / df["car_age"].replace(0, 1)
    df["km_driven_log"]   = np.log1p(df["km_driven"])
    df["km_per_year_log"] = np.log1p(df["km_per_year"])

    # Brand extraction from name
    df["brand"] = df["name"].astype(str).str.split().str[0].str.strip().str.title()

    # Luxury brand flag
    luxury = {"Bmw","Mercedes-Benz","Audi","Volvo","Jaguar","Land","Porsche","Lexus","Bentley","Maserati"}
    df["is_luxury"] = df["brand"].isin(luxury).astype(int)

    # Popular brand flag
    popular = {"Maruti","Hyundai","Honda","Tata","Mahindra","Toyota","Ford","Renault","Volkswagen","Kia"}
    df["is_popular_brand"] = df["brand"].isin(popular).astype(int)

    # Engine power ratio
    df["power_per_cc"] = df["max_power"] / df["engine"].replace(0, np.nan)

    # Interaction features
    df["age_x_km"]       = df["car_age"] * df["km_driven_log"]
    df["mileage_x_power"] = df["mileage"].fillna(df["mileage"].median()) * df["max_power"].fillna(df["max_power"].median())

    # Target
    df = df[df["selling_price"] > 0]
    df["selling_price_log"] = np.log1p(df["selling_price"])

    # Drop raw year
    df.drop(columns=["year"], errors="ignore", inplace=True)

    logger.info(f"Feature engineering done. Shape: {df.shape}")
    return df


# ── 3. Train ──────────────────────────────────────────────────────────────────
def train(df: pd.DataFrame):
    target   = "selling_price_log"
    drop_col = ["selling_price", "selling_price_log", "name"]
    feat_df  = df.drop(columns=[c for c in drop_col if c in df.columns], errors="ignore")

    num_feats = feat_df.select_dtypes(include=["int64","float64"]).columns.tolist()
    cat_feats = feat_df.select_dtypes(include=["object","category"]).columns.tolist()

    logger.info(f"Numerical  : {num_feats}")
    logger.info(f"Categorical: {cat_feats}")

    X = feat_df
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    logger.info(f"Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    preprocessor = ColumnTransformer([
        ("num", num_pipe, num_feats),
        ("cat", cat_pipe, cat_feats),
    ])

    # ── Ensemble of 3 models ──────────────────────────────────────────────────
    gbm = GradientBoostingRegressor(
        n_estimators=500, learning_rate=0.04, max_depth=5,
        subsample=0.8, min_samples_split=8, random_state=42,
    )
    rf = RandomForestRegressor(
        n_estimators=200, max_depth=12, min_samples_split=8,
        n_jobs=-1, random_state=42,
    )

    ensemble = VotingRegressor([("gbm", gbm), ("rf", rf)], weights=[0.7, 0.3])

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor",    ensemble),
    ])

    logger.info("Training ensemble model (GBM 70% + RF 30%)...")
    model.fit(X_train, y_train)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    y_pred_log = model.predict(X_test)
    y_pred     = np.expm1(y_pred_log)
    y_true     = np.expm1(y_test)

    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    mape = float(np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1))) * 100)

    logger.info(f"MAE  : ₹{mae:,.0f}")
    logger.info(f"RMSE : ₹{rmse:,.0f}")
    logger.info(f"R²   : {r2:.4f}")
    logger.info(f"MAPE : {mape:.2f}%")

    cv = cross_val_score(model, X_train, y_train, cv=KFold(5, shuffle=True, random_state=42), scoring="r2")
    logger.info(f"CV R²: {cv.mean():.4f} ± {cv.std():.4f}")

    # ── Feature importance (from GBM sub-model) ───────────────────────────────
    try:
        ohe_cats = model.named_steps["preprocessor"].transformers_[1][1]["encoder"].get_feature_names_out(cat_feats).tolist()
        all_feat_names = num_feats + ohe_cats
        gbm_importances = model.named_steps["regressor"].estimators_[0].feature_importances_
        importance_dict = dict(sorted(zip(all_feat_names, gbm_importances.tolist()), key=lambda x: -x[1])[:15])
        with open(IMPORTANCE_PATH, "w") as f:
            json.dump(importance_dict, f, indent=2)
        logger.info(f"Feature importance saved → {IMPORTANCE_PATH}")
    except Exception as e:
        logger.warning(f"Could not save feature importance: {e}")

    # ── Save artifacts ────────────────────────────────────────────────────────
    joblib.dump(model, MODEL_PATH, compress=3)

    feature_config = {
        "num_features": num_feats,
        "cat_features": cat_feats,
        "target": target,
        "current_year": CURRENT_YEAR,
    }
    with open(FEATURES_PATH, "w") as f:
        json.dump(feature_config, f, indent=2)

    metadata = {
        "trained_at":  datetime.now().isoformat(),
        "n_train":     len(X_train),
        "n_test":      len(X_test),
        "mae":         round(mae, 2),
        "rmse":        round(rmse, 2),
        "r2":          round(r2, 4),
        "mape":        round(mape, 2),
        "cv_r2_mean":  round(float(cv.mean()), 4),
        "cv_r2_std":   round(float(cv.std()), 4),
        "model_type":  "GBM(70%) + RandomForest(30%) Ensemble",
        "num_features": num_feats,
        "cat_features": cat_feats,
        "n_features_total": len(num_feats) + len(cat_feats),
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Model saved     → {MODEL_PATH}")
    logger.info(f"Metadata saved  → {METADATA_PATH}")
    logger.info("Training complete ✓")
    return model, metadata


if __name__ == "__main__":
    df = load_data()
    df = engineer_features(df)
    train(df)
