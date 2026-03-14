"""
app/database/db.py — SQLAlchemy setup + ORM models
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── ORM Model ────────────────────────────────────────────────────────────────
class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id              = Column(Integer, primary_key=True, index=True)
    car_name        = Column(String(120), nullable=False)
    year            = Column(Integer)
    km_driven       = Column(Integer)
    fuel            = Column(String(20))
    transmission    = Column(String(20))
    seller_type     = Column(String(30))
    owner           = Column(String(40))
    predicted_price = Column(Float, nullable=False)
    confidence      = Column(String(10))
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Dependency ───────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
