import os
from pydantic import Field
from pydantic_settings import BaseSettings

# Calculate the base backend directory relative to this file
# Assumes this config file lives inside backend/app/ or backend/app/core/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_default_db_url() -> str:
    """Dynamically determine the database folder path at the project root."""
    # __file__ is backend/app/config.py
    # Step up 3 levels: config.py -> app -> backend -> Project Root
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    db_dir = os.path.join(project_root, "database")
    os.makedirs(db_dir, exist_ok=True)
    
    return f"sqlite:///{os.path.join(db_dir, 'photos.db')}"

class Settings(BaseSettings):
    # API
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8080
    
    # Database (Uses default_factory to build the absolute path dynamically)
    DATABASE_URL: str = Field(default_factory=get_default_db_url)
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Processing
    BATCH_SIZE: int = 100
    MAX_WORKERS: int = 4
    
    # Storage
    STORAGE_PATH: str = "../../storage"
    
    class Config:
        env_file = ".env"

settings = Settings()