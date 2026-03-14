"""
app/main.py - v2
Added: startup event pre-loads model, lifespan context
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from app.api.car_routes import router as car_router
from app.database.db import engine, Base
from app.models.car_model import model_manager
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables + pre-load model
    Base.metadata.create_all(bind=engine)
    try:
        model_manager.load()
        logger.info("Model pre-loaded successfully at startup.")
    except FileNotFoundError:
        logger.warning("Model not found at startup. Run python ml/train_model.py first.")
    yield
    # Shutdown (nothing to clean up)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="REST API for predicting used car resale prices using an ML ensemble model.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start    = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.perf_counter()-start)*1000:.2f}ms"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


app.include_router(car_router, prefix="/api/v1", tags=["Predictions"])


@app.get("/health", tags=["Health"])
async def health():
    model_loaded = model_manager._pipeline is not None
    return {
        "status":       "ok",
        "version":      settings.APP_VERSION,
        "model_loaded": model_loaded,
    }
