import os
from pydantic import Field
from pydantic_settings import BaseSettings

# Calculate the base backend directory relative to this file
# Assumes this config file lives inside backend/app/ or backend/app/core/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_default_db_url() -> str:
    """Dynamically determine the database folder path inside the backend directory."""
    # Traverse upwards until we find the 'backend' root directory
    target_dir = CURRENT_DIR
    while os.path.basename(target_dir) != "backend" and target_dir != os.path.dirname(target_dir):
        target_dir = os.path.dirname(target_dir)
        
    # If we couldn't find a folder named 'backend', fall back to the project root
    if os.path.basename(target_dir) != "backend":
        target_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    db_dir = os.path.join(target_dir, "database")
    # Automatically ensure the 'database' folder folder physically exists on your computer
    os.makedirs(db_dir, exist_ok=True)
    
    return f"sqlite:///{os.path.join(db_dir, 'photos.db')}"

class Settings(BaseSettings):
    # API
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    
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