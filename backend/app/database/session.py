from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# __file__ is backend/app/database/session.py
# Step up 4 levels: session.py -> database -> app -> backend -> Project Root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DB_DIR = os.path.join(PROJECT_ROOT, "database")

os.makedirs(DB_DIR, exist_ok=True)

DEFAULT_DB_URL = f"sqlite:///{os.path.join(DB_DIR, 'photos.db')}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# 1. Added the 15-second timeout to connect_args
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 15} if "sqlite" in DATABASE_URL else {}
)

# 2. Force SQLite into WAL mode for concurrent reading/writing
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()