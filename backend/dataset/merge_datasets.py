"""
merge_datasets.py
Merges all 4 Car Dekho CSV files into one clean used_cars.csv

Place this file inside:  backend/dataset/
Run with:
    python dataset\merge_datasets.py   (from inside backend/)
"""

import pandas as pd
import numpy as np
import os

DATASET_DIR = os.path.dirname(os.path.abspath(__file__))

# ── The 4 files ───────────────────────────────────────────────────────────────
FILES = [
    "car data.csv",
    "CAR DETAILS FROM CAR DEKHO.csv",
    "Car details v3.csv",
    "car details v4.csv",
]

# ── Helper: strip units from columns like "23.4 kmpl", "1248 CC", "74 bhp" ───
def strip_units(series):
    return pd.to_numeric(
        series.astype(str).str.extract(r"([\d.]+)")[0],
        errors="coerce"
    )

# ── Per-file column normalisation ─────────────────────────────────────────────
def normalise(df: pd.DataFrame, filename: str) -> pd.DataFrame:
    # Standardise column names
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    # Rename variants to a common schema
    rename_map = {
        "car_name":      "name",
        "name":          "name",
        "selling_price": "selling_price",
        "km_driven":     "km_driven",
        "fuel":          "fuel",
        "seller_type":   "seller_type",
        "transmission":  "transmission",
        "owner":         "owner",
        "mileage":       "mileage",
        "engine":        "engine",
        "max_power":     "max_power",
        "seats":         "seats",
        "year":          "year",
        "torque":        "torque",   # will be dropped later
    }
    df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns}, inplace=True)

    # Strip units from numeric-text columns
    for col in ["mileage", "engine", "max_power"]:
        if col in df.columns:
            df[col] = strip_units(df[col])

    # Ensure numeric types
    for col in ["selling_price", "km_driven", "year", "seats"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Drop columns not used in training
    df.drop(columns=["torque"], errors="ignore", inplace=True)

    # Keep only the columns we need
    keep = ["name", "year", "selling_price", "km_driven", "fuel",
            "seller_type", "transmission", "owner",
            "mileage", "engine", "max_power", "seats"]
    df = df[[c for c in keep if c in df.columns]]

    print(f"  {filename:<45} → {len(df):>5} rows, {len(df.columns)} cols")
    return df


# ── Load & normalise each file ────────────────────────────────────────────────
frames = []
print("\nLoading datasets...")
print("-" * 65)

for fname in FILES:
    fpath = os.path.join(DATASET_DIR, fname)
    if not os.path.exists(fpath):
        print(f"  SKIPPED (not found): {fname}")
        continue
    try:
        df = pd.read_csv(fpath)
        df = normalise(df, fname)
        frames.append(df)
    except Exception as e:
        print(f"  ERROR reading {fname}: {e}")

if not frames:
    print("\nNo CSV files found. Please place your 4 CSV files inside:")
    print(f"  {DATASET_DIR}")
    exit(1)

# ── Merge all frames ──────────────────────────────────────────────────────────
print("-" * 65)
combined = pd.concat(frames, ignore_index=True)
print(f"\nCombined total  : {len(combined):,} rows")

# ── Clean combined dataset ────────────────────────────────────────────────────

# 1. Drop rows missing the target
combined.dropna(subset=["selling_price"], inplace=True)

# 2. Remove obvious bad prices (< ₹10,000 or > ₹10 crore)
combined = combined[
    (combined["selling_price"] >= 10_000) &
    (combined["selling_price"] <= 100_000_000)
]

# 3. Remove bad years
current_year = 2024
combined = combined[
    (combined["year"] >= 1990) &
    (combined["year"] <= current_year)
]

# 4. Remove bad km_driven
combined = combined[
    (combined["km_driven"] >= 0) &
    (combined["km_driven"] <= 1_000_000)
]

# 5. Standardise text columns (strip whitespace, title case)
for col in ["fuel", "seller_type", "transmission", "owner"]:
    if col in combined.columns:
        combined[col] = combined[col].astype(str).str.strip().str.title()

# 6. Drop exact duplicates
before = len(combined)
combined.drop_duplicates(inplace=True)
print(f"Duplicates removed  : {before - len(combined):,}")

# 7. Reset index
combined.reset_index(drop=True, inplace=True)

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"Final clean rows    : {len(combined):,}")
print(f"Columns             : {list(combined.columns)}")
print(f"\nSelling price range : ₹{combined['selling_price'].min():,.0f}  –  ₹{combined['selling_price'].max():,.0f}")
print(f"Year range          : {int(combined['year'].min())} – {int(combined['year'].max())}")
print(f"Fuel types          : {combined['fuel'].unique().tolist()}")
print(f"Missing values:\n{combined.isnull().sum().to_string()}")

print("\nSample rows:")
print(combined.head(5).to_string())

# ── Save ──────────────────────────────────────────────────────────────────────
out_path = os.path.join(DATASET_DIR, "used_cars.csv")
combined.to_csv(out_path, index=False)
print(f"\n✓ Saved → {out_path}")
print("✓ Now run:  python ml\\train_model.py")
