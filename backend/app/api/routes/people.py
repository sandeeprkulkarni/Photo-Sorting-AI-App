from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Person, Face, Photo
from ai.faces.recognizer import FaceRecognizer
from ai.faces.detector import FaceDetector
from pydantic import BaseModel
from typing import List

router = APIRouter()

class CreatePersonRequest(BaseModel):
    name: str

class TrainPersonRequest(BaseModel):
    person_id: int
    photo_paths: List[str]

@router.post("/")
async def create_person(
    request: CreatePersonRequest,
    db: Session = Depends(get_db)
):
    """Create a new person profile."""
    person = Person(name=request.name)
    db.add(person)
    db.commit()
    db.refresh(person)
    
    return {"person_id": person.id, "name": person.name}

@router.post("/train")
async def train_person(
    request: TrainPersonRequest,
    db: Session = Depends(get_db)
):
    """Train a person with example photos."""
    recognizer = FaceRecognizer(db)
    
    try:
        success = recognizer.train_person(
            request.person_id,
            request.photo_paths
        )
        return {"success": success}
    except ValueError as e:
        return {"success": False, "error": str(e)}

@router.get("/")
async def get_people(db: Session = Depends(get_db)):
    """Get all people."""
    people = db.query(Person).all()
    
    return {
        "people": [
            {
                "id": p.id,
                "name": p.name,
                "photo_count": p.photo_count,
                "is_trained": bool(p.face_embeddings)
            }
            for p in people
        ]
    }

@router.get("/{person_id}/photos")
async def get_person_photos(
    person_id: int,
    db: Session = Depends(get_db)
):
    """Get all photos containing a specific person."""
    faces = db.query(Face).filter(Face.person_id == person_id).all()
    photo_ids = [f.photo_id for f in faces]
    
    photos = db.query(Photo).filter(Photo.id.in_(photo_ids)).all()
    
    return {"photos": photos}

@router.post("/detect-and-recognize")
async def detect_and_recognize_all(db: Session = Depends(get_db)):
    """Detect faces in all photos and recognize them."""
    detector = FaceDetector()
    recognizer = FaceRecognizer(db)
    
    photos = db.query(Photo).filter(Photo.status == "processed").all()
    detected_count = 0
    recognized_count = 0
    
    for photo in photos:
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
            if recognition:
                recognized_count += 1
    
    db.commit()
    return {
        "detected_faces": detected_count,
        "recognized_faces": recognized_count
    }