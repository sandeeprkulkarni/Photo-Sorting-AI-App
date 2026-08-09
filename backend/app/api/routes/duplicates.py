from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.session import get_db
from app.database.models import DuplicateGroup, Photo
from app.workers.tasks import detect_all_duplicates

router = APIRouter()

@router.get("/groups")
async def get_duplicate_groups(db: Session = Depends(get_db)):
    """Fetch all duplicate groups and their associated photos."""
    groups = db.query(DuplicateGroup).all()
    
    result = []
    for group in groups:
        # Fetch all photos belonging to this specific duplicate group
        photos = db.query(Photo).filter(Photo.duplicate_group_id == group.id).all()
        
        group_data = {
            "id": group.id,
            "similarity_score": group.similarity_score,
            "detection_method": group.detection_method,
            "photos": [
                {
                    "id": p.id,
                    "file_path": p.file_path,
                    "original_filename": p.original_filename,
                    "quality_score": p.quality_score or 0.0,
                    "width": p.width or 0,
                    "height": p.height or 0,
                    "file_size": p.file_size or 0,
                    "is_best_in_group": p.is_best_in_group
                } for p in photos
            ]
        }
        result.append(group_data)
        
    return {"groups": result}

@router.post("/detect")
async def start_duplicate_detection():
    """Trigger the background Celery task to scan for duplicates."""
    task = detect_all_duplicates.delay()
    return {"task_id": task.id, "message": "Duplicate detection started"}

class SetBestRequest(BaseModel):
    photo_id: int

@router.post("/{group_id}/set-best")
async def set_best_photo(group_id: str, request: SetBestRequest, db: Session = Depends(get_db)):
    """Update the database to mark which photo the user chose to keep."""
    group = db.query(DuplicateGroup).filter(DuplicateGroup.id == group_id).first()
    if group:
        # Update the group's best photo reference
        group.best_photo_id = request.photo_id
        
        # Loop through the photos and update their boolean flags
        photos = db.query(Photo).filter(Photo.duplicate_group_id == group_id).all()
        for photo in photos:
            photo.is_best_in_group = (photo.id == request.photo_id)
            
        db.commit()
        
    return {"success": True}