import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.import_service import ImportService
from app.workers.tasks import process_photo_batch, export_and_organize_photos
from app.database.models import Photo
from pydantic import BaseModel

router = APIRouter()

class ImportRequest(BaseModel):
    source_path: str
    include_subfolders: bool = True
    skip_duplicates: bool = True
    extract_gps: bool = True
    process_immediately: bool = True
    batch_size: int = 50  # Enforce small chunks for parallel processing

@router.post("/import")
async def import_photos(request: ImportRequest, db: Session = Depends(get_db)):
    service = ImportService(db)
    results = await service.import_photos(
        source_path=request.source_path,
        include_subfolders=request.include_subfolders,
        skip_duplicates=request.skip_duplicates,
        extract_gps=request.extract_gps
    )
    
    if request.process_immediately:
        pending_photos = db.query(Photo).filter(Photo.status == "pending").all()
        photo_ids = [p.id for p in pending_photos]
        
        if photo_ids:
            last_task_id = None
            for i in range(0, len(photo_ids), request.batch_size):
                chunk = photo_ids[i:i + request.batch_size]
                task = process_photo_batch.delay(chunk)
                last_task_id = task.id
                
            # FIX: Return the ACTUAL Celery task ID so the UI progress bar knows what to track!
            results["task_id"] = last_task_id
            
    return results

@router.get("/")
async def get_photos(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    query = db.query(Photo)
    if status:
        query = query.filter(Photo.status == status)
    
    photos = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {"photos": photos, "total": total, "skip": skip, "limit": limit}

@router.post("/{photo_id}/keep")
async def keep_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.status = "organized"
        db.commit()
    return {"success": True}

@router.post("/{photo_id}/reject")
async def reject_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.status = "rejected"
        db.commit()
    return {"success": True}

class RecategorizeRequest(BaseModel):
    category: str

@router.post("/{photo_id}/recategorize")
async def recategorize_photo(photo_id: int, request: RecategorizeRequest, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.whatsapp_category = request.category
        photo.is_whatsapp_forward = request.category in ["spam", "greetings", "sensitive"]
        photo.status = "organized"
        db.commit()
    return {"success": True}

from sqlalchemy import func
from app.database.models import Person

@router.get("/stats/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_photos = db.query(Photo).count()
    processed = db.query(Photo).filter(Photo.status == "processed").count()
    rejected = db.query(Photo).filter(Photo.status == "rejected").count()
    duplicates = db.query(Photo).filter(Photo.is_duplicate == True).count()
    
    useful = db.query(Photo).filter(Photo.whatsapp_category == "useful").count()
    spam = db.query(Photo).filter(Photo.whatsapp_category == "spam").count()
    greetings = db.query(Photo).filter(Photo.whatsapp_category == "greetings").count()
    
    people = db.query(Person).count()
    locations = db.query(func.count(func.distinct(Photo.location_name))).filter(Photo.location_name.isnot(None)).scalar() or 0
    occasions = db.query(func.count(func.distinct(Photo.occasion))).filter(Photo.occasion.isnot(None)).scalar() or 0

    return {
        "totalPhotos": total_photos, "processed": processed, "duplicates": duplicates, "rejected": rejected,
        "people": people, "locations": locations, "occasions": occasions,
        "useful": useful, "spam": spam, "greetings": greetings
    }

@router.post("/process-pending")
async def process_pending_photos(db: Session = Depends(get_db)):
    pending_photos = db.query(Photo).filter(Photo.status == "pending").all()
    if not pending_photos:
        return {"message": "No pending photos to process", "task_id": None}
        
    photo_ids = [photo.id for photo in pending_photos]
    
    # --- FIX: Slice the giant list into smaller chunks so multiple workers can run in parallel ---
    batch_size = 50 
    last_task_id = None
    
    for i in range(0, len(photo_ids), batch_size):
        chunk = photo_ids[i:i + batch_size]
        task = process_photo_batch.delay(chunk)
        last_task_id = task.id  
        
    return {
        "message": f"Started processing {len(photo_ids)} photos in parallel batches of {batch_size}", 
        "task_id": last_task_id, 
        "count": len(photo_ids)
    }

# --- NEW: Export Endpoint ---
class ExportRequest(BaseModel):
    destination_path: str
    action: str = "copy"

@router.post("/export")
async def export_photos(request: ExportRequest, db: Session = Depends(get_db)):
    """Trigger the physical sorting and export of files to the hard drive."""
    if not os.path.exists(request.destination_path):
        os.makedirs(request.destination_path, exist_ok=True)
        
    task = export_and_organize_photos.delay(request.destination_path, request.action)
    return {"message": "Export started", "task_id": task.id}