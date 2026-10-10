from app.workers.queue import celery_app
from app.database.session import SessionLocal
from app.database.models import Photo, Face, Person
from ai.clip.classifier import CLIPClassifier
from ai.ocr.paddle_ocr import OCREngine
from ai.faces.detector import FaceDetector
from ai.duplicates.hash_detector import DuplicateDetector
from ai.quality.scorer import QualityScorer
from app.services.location_service import LocationService
from ai.occasions.classifier import OccasionClassifier
from ai.faces.recognizer import FaceRecognizer
import logging
import os
import shutil
import tempfile
from filelock import FileLock
from datetime import datetime

logger = logging.getLogger(__name__)

# --- GLOBAL AI MODEL CACHE ---
# This prevents reloading gigabytes of models from the hard drive for every batch!
GLOBAL_MODELS = {}

# --- NEW: Strict database lock to prevent 4 workers from writing to SQLite at the exact same millisecond
DB_LOCK_PATH = os.path.join(tempfile.gettempdir(), 'sqlite_write.lock')
db_lock = FileLock(DB_LOCK_PATH, timeout=60)

def get_ai_models():
    if not GLOBAL_MODELS:
        logger.info("Loading AI Models into RAM... (This only happens ONCE per worker)")
        
        # FileLock prevents Windows workers from crashing each other when reading PaddleOCR files
        lock_path = os.path.join(tempfile.gettempdir(), 'paddleocr.lock')
        with FileLock(lock_path):
            GLOBAL_MODELS['ocr'] = OCREngine()
            
        GLOBAL_MODELS['clip'] = CLIPClassifier()
        GLOBAL_MODELS['face_detector'] = FaceDetector()
        GLOBAL_MODELS['quality'] = QualityScorer()
    return GLOBAL_MODELS

def sanitize_filename(name):
    """Removes illegal characters for safe folder creation."""
    if not name: 
        return "Unknown"
    return "".join([c for c in str(name) if c.isalpha() or c.isdigit() or c in (' ', '-', '_')]).rstrip()

@celery_app.task(bind=True)
def process_photo_batch(self, photo_ids: list):
    """Process a batch of photos through the AI pipeline with Session Scoping."""
    # Fetch models instantly from RAM instead of initializing them from disk!
    models = get_ai_models()
    clip_classifier = models['clip']
    ocr_engine = models['ocr']
    face_detector = models['face_detector']
    quality_scorer = models['quality']
    
    total = len(photo_ids)
    
    for idx, photo_id in enumerate(photo_ids):
        try:
            # --- PHASE 1: FAST READ ---
            # Open the DB just to get the file path, then immediately close it.
            db_read = SessionLocal()
            try:
                photo = db_read.query(Photo).filter(Photo.id == photo_id).first()
                if not photo:
                    continue
                file_path = photo.file_path
            finally:
                db_read.close()
            
            # --- PHASE 2: HEAVY AI INFERENCE (No Database Connection Held!) ---
            # All 4 workers can run this simultaneously at 100% CPU speed.
            quality = quality_scorer.assess_quality(file_path)
            clip_result = clip_classifier.classify_image(file_path)
            ocr_result = ocr_engine.extract_text(file_path)
            
            final_cat = clip_result["category"]
            
            if ocr_result.get("is_spam", False):
                final_cat = "spam"
            elif ocr_result.get("is_greeting", False):
                final_cat = "greetings"
            elif final_cat in ["greetings", "spam"] and not ocr_result.get("text", "").strip():
                final_cat = "useful"
            
            status = "auto_rejected" if final_cat in ["spam", "greetings", "sensitive"] else "processed"
            is_whatsapp_forward = final_cat in ["spam", "greetings", "sensitive"]
            
            embedding = clip_classifier.generate_embedding(file_path)
            faces = face_detector.detect_faces(file_path)
            
            # --- PHASE 3: FAST WRITE (Protected by FileLock) ---
            # Wait in a microscopic line to save data so SQLite never crashes.
            with db_lock:
                db_write = SessionLocal()
                try:
                    photo_update = db_write.query(Photo).filter(Photo.id == photo_id).first()
                    if photo_update:
                        photo_update.quality_score = quality["overall_score"]
                        photo_update.sharpness = quality["sharpness"]
                        photo_update.exposure = quality["exposure"]
                        photo_update.blur_score = quality["blur_score"]
                        photo_update.whatsapp_category = final_cat
                        photo_update.is_whatsapp_forward = is_whatsapp_forward
                        photo_update.status = status
                        photo_update.clip_embedding = embedding.tolist()
                        
                        recognizer = FaceRecognizer(db_write)
                        for face_data in faces:
                            recognition = recognizer.recognize_face(face_data["embedding"])
                            
                            face = Face(
                                photo_id=photo_update.id,
                                person_id=recognition["person_id"] if recognition else None,
                                bbox_x=face_data["bbox"][0],
                                bbox_y=face_data["bbox"][1],
                                bbox_width=face_data["bbox"][2],
                                bbox_height=face_data["bbox"][3],
                                embedding=face_data["embedding"],
                                confidence=recognition["confidence"] if recognition else 0.0,
                                quality_score=face_data["quality"]
                            )
                            db_write.add(face)
                        
                        db_write.commit()
                except Exception as db_err:
                    logger.error(f"Database write error for photo {photo_id}: {db_err}")
                    db_write.rollback()
                finally:
                    db_write.close()
                    
            self.update_state(state='PROGRESS', meta={'current': idx + 1, 'total': total})
            
        except Exception as e:
            logger.error(f"Error processing photo {photo_id}: {e}")
            
    return {"processed": total, "success": True}

@celery_app.task(bind=True)
def detect_all_duplicates(self):
    db = SessionLocal()
    try:
        self.update_state(state='PROGRESS', meta={'current': 1, 'total': 1, 'status': 'Running deep duplicate analysis...'})
        detector = DuplicateDetector(db)
        groups = detector.detect_all_duplicates()
        return {"duplicate_groups": len(groups)}
    finally:
        db.close()

@celery_app.task(bind=True)
def process_all_locations(self):
    db = SessionLocal()
    try:
        service = LocationService(db)
        processed = service.process_locations()
        return {"processed": processed, "success": True}
    finally:
        db.close()

@celery_app.task(bind=True)
def classify_all_occasions(self):
    db = SessionLocal()
    try:
        classifier = OccasionClassifier()
        photos = db.query(Photo).filter(Photo.occasion.is_(None)).all()
        total = len(photos)
        
        for idx, photo in enumerate(photos):
            if photo.file_path:
                result = classifier.classify_occasion(photo.file_path)
                photo.occasion = result["occasion"]
                with db_lock:
                    db.flush()
            
            if idx % 5 == 0 or idx == total - 1:
                with db_lock:
                    db.commit()
                
            self.update_state(state='PROGRESS', meta={'current': idx + 1, 'total': total})
            
        return {"processed": total, "success": True}
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

@celery_app.task(bind=True)
def detect_and_recognize_faces(self):
    """Scan Library: Fast vector-matching for currently unknown faces."""
    db = SessionLocal()
    try:
        recognizer = FaceRecognizer(db)
        
        unknown_faces = db.query(Face).filter(Face.person_id.is_(None)).all()
        total = len(unknown_faces)
        recognized_count = 0
        
        if total == 0:
            return {"detected_faces": 0, "recognized_faces": 0, "success": True}
            
        for idx, face in enumerate(unknown_faces):
            # Fast mathematical comparison using existing vectors
            recognition = recognizer.recognize_face(face.embedding)
            
            if recognition:
                # Update the existing face record instead of creating a duplicate
                face.person_id = recognition["person_id"]
                recognized_count += 1
            
            if idx % 50 == 0 or idx == total - 1:
                with db_lock:
                    db.commit()
                
            self.update_state(state='PROGRESS', meta={'current': idx + 1, 'total': total, 'status': f'Matched {recognized_count} faces'})
            
        return {"detected_faces": total, "recognized_faces": recognized_count, "success": True}
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

@celery_app.task(bind=True)
def export_and_organize_photos(self, destination_path: str, action: str):
    db = SessionLocal()
    try:
        photos = db.query(Photo).all()
        total = len(photos)
        
        for idx, photo in enumerate(photos):
            try:
                if not os.path.exists(photo.file_path):
                    continue
                    
                is_junk = False
                sub_folder = ""
                
                if photo.status == "rejected" or photo.status == "auto_rejected":
                    is_junk = True
                    sub_folder = "_To_Delete_/Manually_Rejected" if photo.status == "rejected" else "_To_Delete_/WhatsApp_Spam"
                elif photo.is_duplicate and not photo.is_best_in_group:
                    is_junk = True
                    sub_folder = "_To_Delete_/Duplicates"
                elif photo.whatsapp_category == "greetings":
                    is_junk = True
                    sub_folder = "_To_Delete_/WhatsApp_Greetings"
                    
                if not is_junk:
                    date_obj = photo.taken_date or photo.imported_date or datetime.now()
                    year_folder = str(date_obj.year)
                    loc_folder = sanitize_filename(photo.location_name) if photo.location_name else "Unknown Location"
                    occ_folder = sanitize_filename(photo.occasion) if photo.occasion else "Random"
                    sub_folder = os.path.join(year_folder, loc_folder, occ_folder)
                
                dest_dir = os.path.join(destination_path, os.path.normpath(sub_folder))
                os.makedirs(dest_dir, exist_ok=True)
                dest_file = os.path.join(dest_dir, os.path.basename(photo.file_path))
                
                if os.path.exists(dest_file) and not os.path.samefile(photo.file_path, dest_file):
                    base, ext = os.path.splitext(dest_file)
                    dest_file = f"{base}_{photo.id}{ext}"
                    
                if action == "move":
                    shutil.move(photo.file_path, dest_file)
                    photo.file_path = dest_file 
                else:
                    shutil.copy2(photo.file_path, dest_file)
                    
                if idx % 5 == 0 or idx == total - 1:
                    with db_lock:
                        db.commit()
                    self.update_state(state='PROGRESS', meta={'current': idx + 1, 'total': total, 'status': f'Exported {idx+1} / {total}'})
                    
            except Exception as e:
                logger.error(f"Failed to export photo {photo.id}: {e}")
                db.rollback()
                
        return {"processed": total, "success": True}
    finally:
        db.close()