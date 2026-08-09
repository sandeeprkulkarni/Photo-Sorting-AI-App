from app.workers.queue import celery_app
from app.database.session import SessionLocal
from app.database.models import Photo, Face, Person
from ai.clip.classifier import CLIPClassifier
from ai.faces.detector import FaceDetector
from ai.duplicates.hash_detector import DuplicateDetector
from ai.quality.scorer import QualityScorer
from app.services.location_service import LocationService
from ai.occasions.classifier import OccasionClassifier
from ai.faces.recognizer import FaceRecognizer
import logging
import os

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def process_photo_batch(self, photo_ids: list):
    """Process a batch of photos through the AI pipeline."""
    db = SessionLocal()
    try:
        clip_classifier = CLIPClassifier()
        face_detector = FaceDetector()
        quality_scorer = QualityScorer()
        total = len(photo_ids)
        
        for idx, photo_id in enumerate(photo_ids):
            try:
                photo = db.query(Photo).filter(Photo.id == photo_id).first()
                if not photo:
                    continue
                
                # Quality assessment
                quality = quality_scorer.assess_quality(photo.file_path)
                photo.quality_score = quality["overall_score"]
                photo.sharpness = quality["sharpness"]
                photo.exposure = quality["exposure"]
                photo.blur_score = quality["blur_score"]
                
                # WhatsApp classification
                classification = clip_classifier.classify_image(photo.file_path)
                photo.whatsapp_category = classification["category"]
                photo.is_whatsapp_forward = classification["category"] in ["spam", "greetings", "sensitive"]
                
                # CLIP embedding
                embedding = clip_classifier.generate_embedding(photo.file_path)
                photo.clip_embedding = embedding.tolist()
                
                # Face detection
                faces = face_detector.detect_faces(photo.file_path)
                for face_data in faces:
                    face = Face(
                        photo_id=photo.id,
                        bbox_x=face_data["bbox"][0],
                        bbox_y=face_data["bbox"][1],
                        bbox_width=face_data["bbox"][2],
                        bbox_height=face_data["bbox"][3],
                        embedding=face_data["embedding"],
                        confidence=face_data["confidence"],
                        quality_score=face_data["quality"]
                    )
                    db.add(face)
                
                photo.status = "processed"
                db.commit()
                self.update_state(state='PROGRESS', meta={'current': idx + 1, 'total': total})
                
            except Exception as e:
                logger.error(f"Error processing photo {photo_id}: {e}")
        return {"processed": total, "success": True}
    finally:
        db.close()

@celery_app.task(bind=True)
def detect_all_duplicates(self):
    """Detect duplicates across all photos and broadcast progress."""
    db = SessionLocal()
    
    try:
        # Tell the frontend that we have left the queue and are actively running!
        self.update_state(
            state='PROGRESS',
            meta={'current': 1, 'total': 1, 'status': 'Running deep duplicate analysis...'}
        )
        
        detector = DuplicateDetector(db)
        groups = detector.detect_all_duplicates()
        
        return {"duplicate_groups": len(groups)}
    finally:
        db.close()

@celery_app.task(bind=True)
def process_all_locations(self):
    """Background task for reverse geocoding."""
    db = SessionLocal()
    try:
        service = LocationService(db)
        processed = service.process_locations()
        return {"processed": processed, "success": True}
    finally:
        db.close()

@celery_app.task(bind=True)
def classify_all_occasions(self):
    """Background task for detecting occasions."""
    db = SessionLocal()
    try:
        classifier = OccasionClassifier()
        photos = db.query(Photo).filter(Photo.occasion.is_(None)).all()
        total = len(photos)
        
        for idx, photo in enumerate(photos):
            if photo.file_path:
                result = classifier.classify_occasion(photo.file_path)
                photo.occasion = result["occasion"]
                db.commit()
            self.update_state(state='PROGRESS', meta={'current': idx + 1, 'total': total})
            
        return {"processed": total, "success": True}
    finally:
        db.close()

@celery_app.task(bind=True)
def detect_and_recognize_faces(self):
    """Background task for detecting and matching faces."""
    db = SessionLocal()
    try:
        detector = FaceDetector()
        recognizer = FaceRecognizer(db)
        photos = db.query(Photo).filter(Photo.status == "processed").all()
        total = len(photos)
        detected_count = 0
        
        for idx, photo in enumerate(photos):
            faces = detector.detect_faces(photo.file_path)
            for face_data in faces:
                recognition = recognizer.recognize_face(face_data["embedding"])
                face = Face(
                    photo_id=photo.id,
                    person_id=recognition["person_id"] if recognition else None,
                    bbox_x=face_data["bbox"][0],
                    bbox_y=face_data["bbox"][1],
                    bbox_width=face_data["bbox"][2],
                    bbox_height=face_data["bbox"][3],
                    embedding=face_data["embedding"],
                    confidence=recognition["confidence"] if recognition else 0.0,
                    quality_score=face_data["quality"]
                )
                db.add(face)
                detected_count += 1
            db.commit()
            self.update_state(state='PROGRESS', meta={'current': idx + 1, 'total': total})
            
        return {"detected_faces": detected_count, "success": True}
    finally:
        db.close()