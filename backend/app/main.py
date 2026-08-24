import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.api import auth, projects, analytics, alerts, duplicates, ml, ai, ingestion, risk
from app.services.synthetic_generator import generate_synthetic_data
from app.db.models import Project

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed if empty
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        project_count = db.query(Project).count()
        if project_count == 0:
            logger.info("Database empty. Seeding initial realistic synthetic MPLADS dataset...")
            stats = generate_synthetic_data(db=db, num_projects=140)
            logger.info(f"Seeding completed: {stats}")
        else:
            logger.info(f"Database already contains {project_count} projects.")
    except Exception as e:
        logger.error(f"Error during startup data initialization: {e}")
    finally:
        db.close()
        
    yield
    # Shutdown
    logger.info("Application shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SIH 2026 Problem Statement #102: AI-Powered MPLADS Monitoring, Anomaly Detection & Investigation Platform.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(projects.router, prefix=api_v1_prefix)
app.include_router(analytics.router, prefix=api_v1_prefix)
app.include_router(alerts.router, prefix=api_v1_prefix)
app.include_router(duplicates.router, prefix=api_v1_prefix)
app.include_router(ml.router, prefix=api_v1_prefix)
app.include_router(ai.router, prefix=api_v1_prefix)
app.include_router(ingestion.router, prefix=api_v1_prefix)
app.include_router(risk.router, prefix=api_v1_prefix)


@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": "demonstration_prototype"
    }


@app.get("/")
def root():
    return {
        "message": "Welcome to the MPLADS AI Monitoring and Investigation Platform API.",
        "docs_url": "/docs",
        "health_check": "/health"
    }
