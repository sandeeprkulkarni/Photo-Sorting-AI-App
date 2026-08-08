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
    include_subfolders: bool = True
    skip_duplicates: bool = True
    extract_gps: bool = True
    process_immediately: bool = True

@router.post("/import")
async def import_photos(request: ImportRequest, db: Session = Depends(get_db)):
    """Import photos from a directory and optionally send to Celery."""
    service = ImportService(db)
    
    # Pass the options to the service
    results = await service.import_photos(
        source_path=request.source_path,
        include_subfolders=request.include_subfolders,
        skip_duplicates=request.skip_duplicates,
        extract_gps=request.extract_gps
    )
    
    # Only process if the user checked "Process immediately"
    if request.process_immediately:
        pending_photos = db.query(Photo).filter(Photo.status == "pending").all()
        photo_ids = [p.id for p in pending_photos]
        
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
@router.post("/{photo_id}/keep")
async def keep_photo(photo_id: int, db: Session = Depends(get_db)):
    """Mark a photo as kept and organized."""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.status = "organized"
        db.commit()
    return {"success": True}

@router.post("/{photo_id}/reject")
async def reject_photo(photo_id: int, db: Session = Depends(get_db)):
    """Mark a photo as rejected."""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.status = "rejected"
        db.commit()
    return {"success": True}

class RecategorizeRequest(BaseModel):
    category: str

@router.post("/{photo_id}/recategorize")
async def recategorize_photo(photo_id: int, request: RecategorizeRequest, db: Session = Depends(get_db)):
    """Update a photo's category and mark as organized."""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.whatsapp_category = request.category
        photo.is_whatsapp_forward = request.category in ["spam", "greetings", "sensitive"]
        photo.status = "organized"
        db.commit()
    return {"success": True}