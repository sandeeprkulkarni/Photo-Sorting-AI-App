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
        photo = self.db.query(Photo).filter(Photo.id == photo_id).first()
        if not photo:
            raise ValueError(f"Photo {photo_id} not found")
        
        clip_result = self.clip_classifier.classify_image(photo.file_path)
        ocr_result = self.ocr_engine.extract_text(photo.file_path)
        
        final_category = self._combine_classifications(clip_result, ocr_result)
        embedding = self.clip_classifier.generate_embedding(photo.file_path)
        
        photo.whatsapp_category = final_category
        photo.is_whatsapp_forward = final_category in ["spam", "greetings", "sensitive"]
        photo.clip_embedding = embedding.tolist()
        photo.status = "processed"
        
        self.db.commit()
        
        return {
            "photo_id": photo_id,
            "category": final_category,
            "clip_scores": clip_result["scores"],
            "ocr_text": ocr_result["text"],
            "is_whatsapp_forward": photo.is_whatsapp_forward
        }
    
    def _combine_classifications(self, clip_result: Dict, ocr_result: Dict) -> str:
        # 1. If OCR found massive text, trust OCR
        if ocr_result.get("is_spam", False): return "spam"
        if ocr_result.get("is_greeting", False): return "greetings"
        
        clip_cat = clip_result.get("category", "useful")
        
        # 2. SMART OVERRIDE: True greetings ALWAYS have some text. 
        # If CLIP thinks a photo is a greeting but OCR found NO text, rescue it as "useful"!
        if clip_cat in ["greetings", "spam"]:
            has_text = bool(ocr_result.get("text", "").strip())
            if not has_text:
                return "useful"
        
        return clip_cat