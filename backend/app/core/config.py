from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

_DEFAULT_DB_PATH = str(Path(__file__).resolve().parents[3] / "mplads.db")

class Settings(BaseSettings):
    PROJECT_NAME: str = "MPLADS AI Monitor & Investigation Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "sih-2026-mplads-ai-super-secret-key-production-ready-256bit"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = f"sqlite:///{_DEFAULT_DB_PATH}"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Anomaly Engine Configurable Thresholds
    COST_OVERRUN_WARN_PCT: float = 20.0       # >20% cost escalation
    COST_OVERRUN_CRIT_PCT: float = 50.0       # >50% cost escalation
    PROGRESS_GAP_WARN_PCT: float = 20.0       # Financial % - Physical % > 20%
    PROGRESS_GAP_CRIT_PCT: float = 40.0       # Financial % - Physical % > 40%
    DELAY_WARN_DAYS: int = 60                 # >60 days past expected completion
    DELAY_CRIT_DAYS: int = 180                # >180 days past expected completion
    PAYMENT_SPIKE_RATIO: float = 0.60         # >60% funds released while <30% physical progress
    DUPLICATE_PROXIMITY_KM: float = 2.0       # Look for duplicates within 2 km
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.70  # Text similarity > 70%
    ISOLATION_FOREST_CONTAMINATION: float = 0.15 # 15% estimated outlier proportion

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
