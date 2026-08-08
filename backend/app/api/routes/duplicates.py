from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.workers.tasks import detect_all_duplicates

router = APIRouter()

@router.post("/detect")
async def start_duplicate_detection(db: Session = Depends(get_db)):
    """Trigger background duplicate detection using Celery."""
    # The .delay() command sends it to Redis/Celery!
    task = detect_all_duplicates.delay()
    
    return {
        "message": "Duplicate detection started in the background",
        "task_id": task.id
    }