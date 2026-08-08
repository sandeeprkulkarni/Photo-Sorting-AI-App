from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.database.models import Photo
from app.workers.tasks import classify_all_occasions

router = APIRouter()

@router.get("/")
async def get_occasions(db: Session = Depends(get_db)):
    """Get a list of all occasions and their photo counts."""
    occasions = db.query(
        Photo.occasion.label('name'), 
        func.count(Photo.id).label('count')
    ).filter(Photo.occasion.isnot(None)).group_by(Photo.occasion).all()
    
    return {"occasions": [{"name": occ.name, "count": occ.count} for occ in occasions]}

@router.post("/classify")
async def classify_occasions_background(db: Session = Depends(get_db)):
    """Trigger background occasion classification using Celery."""
    task = classify_all_occasions.delay()
    return {"message": "Occasion classification started", "task_id": task.id}