from app.workers.queue import celery_app
from app.database.session import SessionLocal
from ai.clip.classifier import CLIPClassifier
from ai.faces.detector import FaceDetector
from ai.duplicates.hash_detector import DuplicateDetector
from ai.quality.scorer import QualityScorer
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def process_photo_batch(self, photo_ids: list):
    """Process a batch of photos through the AI pipeline."""
    db = SessionLocal()
    
    try:
        # Initialize AI models
        clip_classifier = CLIPClassifier()
        face_detector = FaceDetector()
        quality_scorer = QualityScorer()
        
        total = len(photo_ids)
        
        for idx, photo_id in enumerate(photo_ids):
            try:
                photo = db.query(Photo).filter(Photo.id == photo_id).first()
                
                if not photo:
                    continue
                
                # Step 1: Quality assessment
                quality = quality_scorer.assess_quality(photo.file_path)
                photo.quality_score = quality["overall_score"]
                photo.sharpness = quality["sharpness"]
                photo.exposure = quality["exposure"]
                photo.blur_score = quality["blur_score"]
                
                # Step 2: WhatsApp classification
                classification = clip_classifier.classify_image(photo.file_path)
                photo.whatsapp_category = classification["category"]
                photo.is_whatsapp_forward = classification["category"] in ["spam", "greetings", "sensitive"]
                
                # Step 3: Generate CLIP embedding
                embedding = clip_classifier.generate_embedding(photo.file_path)
                photo.clip_embedding = embedding.tolist()
                
                # Step 4: Face detection
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
                
                # Update progress
                self.update_state(
                    state='PROGRESS',
                    meta={'current': idx + 1, 'total': total}
                )
                
            except Exception as e:
                logger.error(f"Error processing photo {photo_id}: {e}")
        
        return {"processed": total, "success": True}
        
    finally:
        db.close()

@celery_app.task
def detect_all_duplicates():
    """Detect duplicates across all photos."""
    db = SessionLocal()
    
    try:
        detector = DuplicateDetector(db)
        groups = detector.detect_all_duplicates()
        
        return {"duplicate_groups": len(groups)}
    finally:
        db.close()

@celery_app.task
def organize_photos_by_people():
    """Organize photos into people folders."""
    import shutil
    
    db = SessionLocal()
    
    try:
        people = db.query(Person).all()
        organized_count = 0
        
        for person in people:
            person_folder = f"storage/people/{person.name}"
            os.makedirs(person_folder, exist_ok=True)
            
            # Get all photos with this person
            faces = db.query(Face).filter(Face.person_id == person.id).all()
            
            for face in faces:
                photo = face.photo
                dest_path = os.path.join(person_folder, os.path.basename(photo.file_path))
                
                if not os.path.exists(dest_path):
                    shutil.copy2(photo.file_path, dest_path)
                    organized_count += 1
        
        return {"organized": organized_count}
    finally:
        db.close()