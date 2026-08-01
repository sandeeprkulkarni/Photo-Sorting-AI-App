from ai.clip.classifier import CLIPClassifier
from ai.ocr.paddle_ocr import OCREngine
from typing import Dict
from sqlalchemy.orm import Session
from app.database.models import Photo

class ClassificationService:
    def __init__(self, db: Session):
        self.db = db
        self.clip_classifier = CLIPClassifier()
        self.ocr_engine = OCREngine()
    
    def classify_photo(self, photo_id: int) -> dict:
        """
        Classify a photo using both CLIP and OCR.
        """
        photo = self.db.query(Photo).filter(Photo.id == photo_id).first()
        if not photo:
            raise ValueError(f"Photo {photo_id} not found")
        
        # CLIP classification
        clip_result = self.clip_classifier.classify_image(photo.file_path)
        
        # OCR text extraction
        ocr_result = self.ocr_engine.extract_text(photo.file_path)
        
        # Combine results
        final_category = self._combine_classifications(clip_result, ocr_result)
        
        # Generate embedding for future similarity search
        embedding = self.clip_classifier.generate_embedding(photo.file_path)
        
        # Update photo record
        photo.whatsapp_category = final_category
        photo.is_whatsapp_forward = final_category in ["spam", "greetings", "sensitive"]
        photo.clip_embedding = embedding.tolist()
        photo.status = "classified"
        
        self.db.commit()
        
        return {
            "photo_id": photo_id,
            "category": final_category,
            "clip_scores": clip_result["scores"],
            "ocr_text": ocr_result["text"],
            "is_whatsapp_forward": photo.is_whatsapp_forward
        }
    
    def _combine_classifications(self, clip_result: Dict, ocr_result: Dict) -> str:
        # Use .get() so it defaults to False if the key is missing
        if ocr_result.get("is_spam", False):
            return "spam"
        if ocr_result.get("is_greeting", False):
            return "greetings"
        if ocr_result.get("is_document", False):
            return "documents"
        
        # Otherwise, use CLIP classification
        if clip_result["confidence"] > 0.6:
            return clip_result["category"]
        
        # Default to useful if uncertain
        return "useful"