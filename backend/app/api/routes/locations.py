from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Photo
from app.services.location_service import LocationService

router = APIRouter()

@router.post("/process")
async def process_locations(db: Session = Depends(get_db)):
    """Reverse geocode all photos with GPS coordinates."""
    service = LocationService(db)
    processed_count = service.process_locations()
    return {"success": True, "processed": processed_count}

@router.get("/")
async def get_locations(db: Session = Depends(get_db)):
    """Get a list of all detected locations and their photo counts."""
    from sqlalchemy import func
    locations = db.query(
        Photo.location_name, 
        func.count(Photo.id)
    ).filter(Photo.location_name.isnot(None)).group_by(Photo.location_name).all()
    
    return {"locations": [{"name": loc[0], "count": loc[1]} for loc in locations]}