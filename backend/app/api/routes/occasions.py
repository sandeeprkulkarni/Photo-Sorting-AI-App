from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Photo
from ai.occasions.classifier import OccasionClassifier

router = APIRouter()

@router.post("/classify")
async def classify_occasions(db: Session = Depends(get_db)):
    """Run CLIP classification to detect occasions for photos."""
    classifier = OccasionClassifier()
    photos = db.query(Photo).filter(Photo.occasion.is_(None)).all()
    
    processed = 0
    for photo in photos:
        try:
            result = classifier.classify_occasion(photo.file_path)
            photo.occasion = result["occasion"]
            processed += 1
        except Exception as e:
            print(f"Error classifying {photo.id}: {e}")
            
    db.commit()
    return {"success": True, "processed": processed}

@router.get("/")
async def get_occasions(db: Session = Depends(get_db)):
    """Get a list of all detected occasions and their photo counts."""
    from sqlalchemy import func
    occasions = db.query(
        Photo.occasion, 
        func.count(Photo.id)
    ).filter(Photo.occasion.isnot(None)).group_by(Photo.occasion).all()
    
    return {"occasions": [{"name": occ[0], "count": occ[1]} for occ in occasions]}