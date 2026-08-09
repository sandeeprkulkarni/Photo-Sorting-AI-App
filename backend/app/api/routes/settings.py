import os
import shutil
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy import text
from app.database.session import engine, Base

router = APIRouter()

# Paths relative to the backend execution directory
DB_PATH = "../database/photos.db"
STORAGE_PATH = "../storage"

@router.get("/storage")
async def get_storage_stats():
    """Calculate the actual size of the SQLite database and temporary cache."""
    db_size_mb = 0
    if os.path.exists(DB_PATH):
        db_size_mb = os.path.getsize(DB_PATH) / (1024 * 1024)
        
    cache_dir = os.path.join(STORAGE_PATH, "cache")
    cache_size_mb = 0
    if os.path.exists(cache_dir):
        cache_size_mb = sum(
            os.path.getsize(os.path.join(dirpath, filename))
            for dirpath, _, filenames in os.walk(cache_dir)
            for filename in filenames
        ) / (1024 * 1024)
        
    return {
        "database_size_mb": round(db_size_mb, 1),
        "cache_size_mb": round(cache_size_mb, 1)
    }

@router.post("/clear-cache")
async def clear_cache():
    """Empty the temporary processing cache."""
    cache_dir = os.path.join(STORAGE_PATH, "cache")
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)
    os.makedirs(cache_dir, exist_ok=True)
    return {"success": True, "message": "Cache cleared successfully."}

@router.post("/optimize-db")
async def optimize_db():
    """Run SQLite VACUUM to reclaim empty space and optimize queries."""
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("VACUUM"))
    return {"success": True, "message": "Database optimized successfully."}

@router.get("/export-db")
async def export_db():
    """Download a raw copy of the SQLite database."""
    if os.path.exists(DB_PATH):
        return FileResponse(
            path=DB_PATH, 
            filename="photos_backup.db", 
            media_type="application/octet-stream"
        )
    return {"error": "Database not found."}

@router.post("/reset-data")
async def reset_data():
    """Nuclear option: Drop all tables and clear all storage folders."""
    # Drop and recreate all database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Wipe physical storage folders but keep the directory structure
    folders = ["originals", "duplicates", "rejected", "people", "locations", "occasions", "cache"]
    for folder in folders:
        path = os.path.join(STORAGE_PATH, folder)
        if os.path.exists(path):
            shutil.rmtree(path)
        os.makedirs(path, exist_ok=True)
        
    return {"success": True, "message": "All data has been permanently deleted."}