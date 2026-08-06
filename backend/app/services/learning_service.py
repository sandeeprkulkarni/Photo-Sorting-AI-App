from sqlalchemy.orm import Session
from app.database.models import UserCorrection, Photo
import numpy as np

class LearningService:
    def __init__(self, db: Session):
        self.db = db
    
    def collect_training_data(self, correction_type: str) -> dict:
        """
        Collect embeddings and labels from user corrections.
        Returns: {
            "embeddings": [...],
            "labels": [...],
            "count": 100
        }
        """
        corrections = self.db.query(UserCorrection).filter(
            UserCorrection.correction_type == correction_type
        ).all()
        
        embeddings = []
        labels = []
        
        for correction in corrections:
            photo = self.db.query(Photo).filter(
                Photo.id == correction.photo_id
            ).first()
            
            if photo and photo.clip_embedding:
                embeddings.append(photo.clip_embedding)
                labels.append(correction.corrected_value)
        
        return {
            "embeddings": embeddings,
            "labels": labels,
            "count": len(embeddings)
        }
    
    def should_retrain(self, correction_type: str, threshold: int = 100) -> bool:
        """Check if we have enough corrections to retrain."""
        count = self.db.query(UserCorrection).filter(
            UserCorrection.correction_type == correction_type
        ).count()
        
        return count >= threshold