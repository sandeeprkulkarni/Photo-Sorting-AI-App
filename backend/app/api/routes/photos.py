from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.import_service import ImportService
from app.workers.tasks import process_photo_batch
from app.database.models import Photo
from pydantic import BaseModel

router = APIRouter()

class ImportRequest(BaseModel):
    source_path: str

@router.post("/import")
async def import_photos(request: ImportRequest, db: Session = Depends(get_db)):
    """Import photos from a directory and send to Celery."""
    service = ImportService(db)
    results = await service.import_photos(request.source_path)
    
    # Grab all photos that need initial AI processing
    pending_photos = db.query(Photo).filter(Photo.status == "pending").all()
    photo_ids = [p.id for p in pending_photos]
    
    # Dispatch to Celery background worker
    if photo_ids:
        task = process_photo_batch.delay(photo_ids)
        results["task_id"] = task.id
        
    return results

@router.get("/")
async def get_photos(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    """Get list of photos."""
    query = db.query(Photo)
    if status:
        query = query.filter(Photo.status == status)
    
    photos = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "photos": photos,
        "total": total,
        "skip": skip,
        "limit": limit
    }