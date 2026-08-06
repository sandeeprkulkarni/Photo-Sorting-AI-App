from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import UserCorrection, Photo
from pydantic import BaseModel

router = APIRouter()

class FeedbackRequest(BaseModel):
    photo_id: int
    correction_type: str  # occasion, location, person, category
    original_value: str
    corrected_value: str

@router.post("/")
async def submit_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """Record a user correction."""
    # Create correction record
    correction = UserCorrection(
        photo_id=request.photo_id,
        correction_type=request.correction_type,
        original_value=request.original_value,
        corrected_value=request.corrected_value
    )
    db.add(correction)
    
    # Update photo with corrected value
    photo = db.query(Photo).filter(Photo.id == request.photo_id).first()
    if photo:
        if request.correction_type == "occasion":
            photo.occasion = request.corrected_value
        elif request.correction_type == "location":
            photo.location = request.corrected_value
        elif request.correction_type == "category":
            photo.whatsapp_category = request.corrected_value
    
    db.commit()
    
    return {"success": True}

@router.get("/stats")
async def get_feedback_stats(db: Session = Depends(get_db)):
    """Get statistics on user corrections."""
    from sqlalchemy import func
    
    stats = db.query(
        UserCorrection.correction_type,
        func.count(UserCorrection.id)
    ).group_by(UserCorrection.correction_type).all()
    
    return {
        "corrections_by_type": {
            corr_type: count for corr_type, count in stats
        }
    }