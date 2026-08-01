import asyncio
import traceback
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.import_service import ImportService
from pydantic import BaseModel

router = APIRouter()

class ImportRequest(BaseModel):
    source_path: str

@router.post("/import")
async def import_photos(
    request: ImportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Import photos from a directory."""
    service = ImportService(db)
    results = await service.import_photos(request.source_path)
    
    # Trigger background processing
    background_tasks.add_task(process_imported_photos, db)
    
    return results

@router.get("/")
async def get_photos(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get list of photos."""
    from app.database.models import Photo
    
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

class RecategorizeRequest(BaseModel):
    category: str

@router.post("/{photo_id}/keep")
async def keep_photo(photo_id: int, db: Session = Depends(get_db)):
    """Mark a classified photo as kept/useful."""
    from app.database.models import Photo
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.status = "processed"
        db.commit()
    return {"success": True}

@router.post("/{photo_id}/reject")
async def reject_photo(photo_id: int, db: Session = Depends(get_db)):
    """Mark a photo as rejected (spam/junk)."""
    from app.database.models import Photo
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.status = "rejected"
        db.commit()
    return {"success": True}

@router.post("/{photo_id}/recategorize")
async def recategorize_photo(photo_id: int, request: RecategorizeRequest, db: Session = Depends(get_db)):
    """Manually correct the AI's WhatsApp category."""
    from app.database.models import Photo
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.whatsapp_category = request.category
        # Once categorized manually, move it to processed
        photo.status = "processed" 
        db.commit()
    return {"success": True}

from app.services.classification_service import ClassificationService

def process_imported_photos(db: Session):
    """Background task to process newly imported photos using AI."""
    from app.database.models import Photo
    
    # Find all photos that were just imported and haven't been classified yet
    pending_photos = db.query(Photo).filter(Photo.status == "pending").all()
    classifier = ClassificationService(db)
    
    for photo in pending_photos:
        try:
            print(f"Scanning photo {photo.id} with AI...")
            classifier.classify_photo(photo.id)
        except Exception as e:
            print(f"Error classifying photo {photo.id}: {e}")
            traceback.print_exc()
@router.get("/{photo_id}/image")
def get_photo_image(photo_id: int, db: Session = Depends(get_db)):
    from app.database.models import Photo

    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # FileResponse securely streams the local file over HTTP
    return FileResponse(photo.file_path)