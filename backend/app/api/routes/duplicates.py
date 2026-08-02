from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.session import get_db
from app.database.models import DuplicateGroup, Photo
from ai.duplicates.hash_detector import DuplicateDetector

router = APIRouter()

class SetBestRequest(BaseModel):
    photo_id: int

@router.post("/detect")
async def trigger_duplicate_detection(db: Session = Depends(get_db)):
    """Trigger the AI to scan all photos for exact, perceptual, and semantic duplicates."""
    detector = DuplicateDetector(db)
    group_ids = detector.detect_all_duplicates()
    
    return {
        "message": "Duplicate detection complete",
        "duplicate_groups_found": len(group_ids)
    }

@router.get("/groups")
async def get_duplicate_groups(db: Session = Depends(get_db)):
    """Get a list of all duplicate groups and their associated photos."""
    groups = db.query(DuplicateGroup).all()
    
    result = []
    for group in groups:
        photos = db.query(Photo).filter(Photo.duplicate_group_id == group.id).all()
        result.append({
            "id": group.id,
            "similarity_score": group.similarity_score,
            "detection_method": group.detection_method,
            "photos": photos
        })
        
    return {"groups": result}

@router.post("/{group_id}/set-best")
async def set_best_photo(group_id: str, request: SetBestRequest, db: Session = Depends(get_db)):
    """Update which photo is marked as the best one, reject others, and resolve the group."""
    photos = db.query(Photo).filter(Photo.duplicate_group_id == group_id).all()
    
    for photo in photos:
        if photo.id == request.photo_id:
            # This is the keeper
            photo.is_best_in_group = True
            photo.is_duplicate = False
        else:
            # These are the duplicates to reject
            photo.is_best_in_group = False
            photo.status = "rejected"
            
    # Delete the duplicate group record so it disappears from the UI queue
    group = db.query(DuplicateGroup).filter(DuplicateGroup.id == group_id).first()
    if group:
        db.delete(group)
        
    db.commit()
    return {"success": True}
@router.post("/{group_id}/reject-all")
async def reject_all_photos(group_id: str, db: Session = Depends(get_db)):
    """Reject all photos in a duplicate group and resolve the group."""
    photos = db.query(Photo).filter(Photo.duplicate_group_id == group_id).all()
    
    # Mark every photo in the group as rejected
    for photo in photos:
        photo.is_best_in_group = False
        photo.status = "rejected"
        
    # Delete the duplicate group record so it disappears from the UI
    group = db.query(DuplicateGroup).filter(DuplicateGroup.id == group_id).first()
    if group:
        db.delete(group)
        
    db.commit()
    return {"success": True}