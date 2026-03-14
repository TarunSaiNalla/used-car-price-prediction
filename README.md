# Used Car Price Prediction System

A full-stack ML application that predicts used car resale prices using a
Gradient Boosting model served through FastAPI, with a React frontend.

---

## Project Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── core/config.py           # Settings (pydantic-settings)
│   │   ├── api/car_routes.py        # REST endpoints
│   │   ├── schemas/car_schema.py    # Pydantic I/O models
│   │   ├── models/car_model.py      # Singleton model loader
│   │   ├── services/prediction_service.py
│   │   ├── utils/data_preprocessing.py
│   │   └── database/db.py           # SQLAlchemy + ORM
│   ├── ml/
│   │   ├── train_model.py           # Training pipeline (run once)
│   │   └── artifacts/               # Saved model + metadata (git-ignored)
│   ├── dataset/used_cars.csv
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── services/api.js
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── PricePredictionForm.js
│   │   └── pages/
│   │       ├── Home.js
│   │       ├── About.js
│   │       └── NotFound.js
│   └── Dockerfile
└── docker-compose.yml
```

---

## Quick Start

### 1. Train the model

```bash
cd backend
pip install -r requirements.txt
python ml/train_model.py
```

### 2. Start the API

```bash
uvicorn app.main:app --reload --port 8000
# Docs: http://localhost:8000/docs
```

### 3. Start the frontend

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000/api/v1 npm start
```

### 4. Or use Docker Compose (recommended)

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

---

## API Reference

| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| POST   | `/api/v1/predict`         | Predict car resale price     |
| GET    | `/api/v1/predictions`     | Prediction history (paginated)|
| GET    | `/api/v1/predictions/:id` | Single prediction log        |
| GET    | `/api/v1/model/info`      | Trained model metrics        |
| GET    | `/health`                 | Health check                 |

### Example Request

```json
POST /api/v1/predict
{
  "name": "Maruti Swift VXI",
  "year": 2019,
  "km_driven": 45000,
  "fuel": "Petrol",
  "seller_type": "Individual",
  "transmission": "Manual",
  "owner": "First Owner",
  "mileage": 21.4,
  "engine": 1197,
  "max_power": 81.8,
  "seats": 5
}
```

### Example Response

```json
{
  "predicted_price": 548000,
  "price_range_low": 493200,
  "price_range_high": 602800,
  "confidence_label": "High",
  "prediction_id": 42,
  "created_at": "2024-06-01T10:30:00Z"
}
```

---

## Dataset Column Reference

The training CSV (`used_cars.csv`) should contain these columns:

| Column          | Type    | Notes                  |
|-----------------|---------|------------------------|
| name            | string  | Car brand + model      |
| year            | int     | Manufacturing year     |
| selling_price   | int     | Target variable (INR)  |
| km_driven       | int     | Odometer reading       |
| fuel            | string  | Petrol/Diesel/CNG…     |
| seller_type     | string  | Dealer/Individual…     |
| transmission    | string  | Manual/Automatic       |
| owner           | string  | First/Second…          |
| mileage         | float   | km/l or km/kg          |
| engine          | float   | CC                     |
| max_power       | float   | bhp                    |
| seats           | int     | Seat count             |

---

## Architecture Notes

### Why log-transform the target?
Car prices are right-skewed. Training on `log(price)` and inverting at
inference with `expm1()` reduces the impact of outliers and improves RMSE.

### Why Gradient Boosting?
GBM outperforms linear models on tabular data with mixed feature types and
non-linear interactions (age × mileage, brand prestige). For production
scale consider XGBoost or LightGBM for speed.

### Confidence Intervals
Currently ±10% heuristic. For production, replace with a **quantile
regression** model that outputs P10/P90 bounds directly.

### Scaling the DB
SQLite is fine for development. Swap `DATABASE_URL` in `.env` for
PostgreSQL in production — no code changes required.

---

## Deployment Options

| Target       | How |
|--------------|-----|
| Local        | `docker-compose up` |
| AWS          | ECS Fargate + RDS PostgreSQL |
| GCP          | Cloud Run (backend) + Firebase Hosting (frontend) |
| Heroku       | `heroku container:push web` |
| Railway.app  | Connect GitHub repo, set env vars |

---

## Environment Variables

Create `backend/.env`:

```
DATABASE_URL=sqlite:///./predictions.db
ALLOWED_ORIGINS=["http://localhost:3000"]
MODEL_PATH=backend/ml/artifacts/car_price_model.pkl
DEBUG=false
```
