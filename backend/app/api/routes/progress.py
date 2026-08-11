from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Photo
from celery.result import AsyncResult

router = APIRouter()

@router.get("/task/{task_id}")
async def get_task_progress(task_id: str, db: Session = Depends(get_db)):
    """Track Celery tasks or overall DB import progress."""
    
    # 1. Custom Database Tracking for Multi-Worker Imports
    if task_id == "import_tracking":
        total = db.query(Photo).count()
        processed = db.query(Photo).filter(Photo.status != "pending").count()
        
        state = "PROGRESS"
        if processed >= total and total > 0:
            state = "SUCCESS"
            
        return {
            "state": state,
            "current": processed,
            "total": total,
            "status": f"AI Processing: {processed} / {total} photos..."
        }

    # 2. Standard Celery Task Tracking (for Duplicates, etc.)
    task = AsyncResult(task_id)
    response = {
        "state": task.state,
        "current": 0,
        "total": 1,
        "status": "Waiting in queue..."
    }
    
    if task.info and isinstance(task.info, dict):
        response["current"] = task.info.get("current", 0)
        response["total"] = task.info.get("total", 1)
        response["status"] = task.info.get("status", "Processing...")
        
    return response