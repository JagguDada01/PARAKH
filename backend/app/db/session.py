from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Engine configuration
connect_args = {}
pool_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 60}
    pool_kwargs = {"poolclass": NullPool}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    **pool_kwargs
)

if settings.DATABASE_URL.startswith("sqlite"):
    with engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA journal_mode=WAL;")
        connection.exec_driver_sql("PRAGMA synchronous=NORMAL;")



SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
