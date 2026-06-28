from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get the directory where session.py resides, then find the backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# This will point to a 'database' folder directly inside your project backend root
DB_DIR = os.path.join(BASE_DIR, "database")

# Automatically create the 'database' directory if it doesn't exist
os.makedirs(DB_DIR, exist_ok=True)

# Define the absolute SQLite path
DEFAULT_DB_URL = f"sqlite:///{os.path.join(DB_DIR, 'photos.db')}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()