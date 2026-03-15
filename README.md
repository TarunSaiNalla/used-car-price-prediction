# \# Used Car Price Prediction System

# 

🌐 \*\*Live Demo:\*\* https://used-car-frontend.onrender.com

📡 \*\*API Docs:\*\* https://used-car-price-prediction-m5nc.onrender.com/docs



A full-stack ML application that predicts used car resale prices using a

Gradient Boosting model served through FastAPI, with a React frontend.



\---
Project Structure
===

```
project-root/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── core/config.py           # Settings (pydantic-settings)
│   │   ├── api/car\\\_routes.py        # REST endpoints
│   │   ├── schemas/car\\\_schema.py    # Pydantic I/O models
│   │   ├── models/car\\\_model.py      # Singleton model loader
│   │   ├── services/prediction\\\_service.py
│   │   ├── utils/data\\\_preprocessing.py
│   │   └── database/db.py           # SQLAlchemy + ORM
│   ├── ml/
│   │   ├── train\\\_model.py           # Training pipeline (run once)
│   │   └── artifacts/               # Saved model + metadata (git-ignored)
│   ├── dataset/used\\\_cars.csv
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

\---

## Quick Start

### 1\. Train the model

```bash
cd backend
pip install -r requirements.txt
python ml/train\\\_model.py
```

### 2\. Start the API

```bash
uvicorn app.main:app --reload --port 8000
# Docs: http://localhost:8000/docs
```

### 3\. Start the frontend

```bash
cd frontend
npm install
REACT\\\_APP\\\_API\\\_URL=http://localhost:8000/api/v1 npm start
```

### 4\. Or use Docker Compose (recommended)

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

\---

## API Reference

|Method|Endpoint|Description|
|-|-|-|
|POST|`/api/v1/predict`|Predict car resale price|
|GET|`/api/v1/predictions`|Prediction history (paginated)|
|GET|`/api/v1/predictions/:id`|Single prediction log|
|GET|`/api/v1/model/info`|Trained model metrics|
|GET|`/health`|Health check|

### Example Request

```json
POST /api/v1/predict
{
  "name": "Maruti Swift VXI",
  "year": 2019,
  "km\\\_driven": 45000,
  "fuel": "Petrol",
  "seller\\\_type": "Individual",
  "transmission": "Manual",
  "owner": "First Owner",
  "mileage": 21.4,
  "engine": 1197,
  "max\\\_power": 81.8,
  "seats": 5
}
```

### Example Response

```json
{
  "predicted\\\_price": 548000,
  "price\\\_range\\\_low": 493200,
  "price\\\_range\\\_high": 602800,
  "confidence\\\_label": "High",
  "prediction\\\_id": 42,
  "created\\\_at": "2024-06-01T10:30:00Z"
}
```

\---

## Dataset Column Reference

The training CSV (`used\\\_cars.csv`) should contain these columns:

|Column|Type|Notes|
|-|-|-|
|name|string|Car brand + model|
|year|int|Manufacturing year|
|selling\_price|int|Target variable (INR)|
|km\_driven|int|Odometer reading|
|fuel|string|Petrol/Diesel/CNG…|
|seller\_type|string|Dealer/Individual…|
|transmission|string|Manual/Automatic|
|owner|string|First/Second…|
|mileage|float|km/l or km/kg|
|engine|float|CC|
|max\_power|float|bhp|
|seats|int|Seat count|

\---

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

SQLite is fine for development. Swap `DATABASE\\\_URL` in `.env` for
PostgreSQL in production — no code changes required.

\---

## Deployment Options

|Target|How|
|-|-|
|Local|`docker-compose up`|
|AWS|ECS Fargate + RDS PostgreSQL|
|GCP|Cloud Run (backend) + Firebase Hosting (frontend)|
|Heroku|`heroku container:push web`|
|Railway.app|Connect GitHub repo, set env vars|

\---

## Environment Variables

Create `backend/.env`:

```
DATABASE\\\_URL=sqlite:///./predictions.db
ALLOWED\\\_ORIGINS=\\\["http://localhost:3000"]
MODEL\\\_PATH=backend/ml/artifacts/car\\\_price\\\_model.pkl
DEBUG=false
```

