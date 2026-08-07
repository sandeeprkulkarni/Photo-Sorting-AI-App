from app.services.location_service import LocationService
from ai.occasions.classifier import OccasionClassifier
from ai.faces.recognizer import FaceRecognizer

@celery_app.task(bind=True)
def process_all_locations(self):
    """Background task for reverse geocoding."""
    db = SessionLocal()
    try:
        service = LocationService(db)
        # Using a simplified version of processing for the background worker
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
        db.close()from app.services.location_service import LocationService
from ai.occasions.classifier import OccasionClassifier
from ai.faces.recognizer import FaceRecognizer

@celery_app.task(bind=True)
def process_all_locations(self):
    """Background task for reverse geocoding."""
    db = SessionLocal()
    try:
        service = LocationService(db)
        # Using a simplified version of processing for the background worker
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