from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.database.models import Photo
from app.workers.tasks import process_all_locations

router = APIRouter()

@router.get("/")
async def get_locations(db: Session = Depends(get_db)):
    """Get a list of all locations and their photo counts."""
    locations = db.query(
        Photo.location_name.label('name'), 
        func.count(Photo.id).label('count')
    ).filter(Photo.location_name.isnot(None)).group_by(Photo.location_name).all()
    
    return {"locations": [{"name": loc.name, "count": loc.count} for loc in locations]}

@router.post("/process")
async def process_locations_background(db: Session = Depends(get_db)):
    """Trigger background reverse geocoding using Celery."""
    task = process_all_locations.delay()
    return {"message": "Location processing started", "task_id": task.id}