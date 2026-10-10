from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.database.models import Person, Face, Photo
from ai.faces.recognizer import FaceRecognizer
from ai.faces.detector import FaceDetector
from pydantic import BaseModel
from typing import List
from app.workers.tasks import detect_and_recognize_faces

router = APIRouter()

class CreatePersonRequest(BaseModel):
    name: str

class TrainPersonRequest(BaseModel):
    person_id: int
    photo_paths: List[str]

class TagFaceRequest(BaseModel):
    person_id: int

@router.post("/")
async def create_person(request: CreatePersonRequest, db: Session = Depends(get_db)):
    existing_person = db.query(Person).filter(Person.name == request.name).first()
    if existing_person:
        return {"person_id": existing_person.id, "name": existing_person.name, "status": "existing"}

    person = Person(name=request.name)
    db.add(person)
    db.commit()
    db.refresh(person)
    return {"person_id": person.id, "name": person.name, "status": "new"}

@router.post("/train")
async def train_person(request: TrainPersonRequest, db: Session = Depends(get_db)):
    recognizer = FaceRecognizer(db)
    try:
        success = recognizer.train_person(request.person_id, request.photo_paths)
        if success:
            person = db.query(Person).filter(Person.id == request.person_id).first()
            if person:
                existing_paths = person.training_photo_paths or []
                person.training_photo_paths = list(set(existing_paths + request.photo_paths))
                db.commit()
        return {"success": success}
    except ValueError as e:
        return {"success": False, "error": str(e)}

@router.get("/")
async def get_people(db: Session = Depends(get_db)):
    people = db.query(Person).all()
    result = []
    for p in people:
        real_count = db.query(func.count(func.distinct(Face.photo_id))).filter(Face.person_id == p.id).scalar() or 0
        training_paths = p.training_photo_paths or []
        result.append({
            "id": p.id,
            "name": p.name,
            "photo_count": real_count,
            "training_photo_count": len(training_paths),
            "training_photo_paths": training_paths,
            "is_trained": bool(p.face_embeddings)
        })
    return {"people": result}

@router.get("/stats/overview")
async def get_people_stats(db: Session = Depends(get_db)):
    trained_people = db.query(Person).filter(Person.face_embeddings.isnot(None)).count()
    faces_detected = db.query(Face).count()
    recognized = db.query(Face).filter(Face.person_id.isnot(None)).count()
    unknown = db.query(Face).filter(Face.person_id.is_(None)).count()
    return {
        "trained_people": trained_people, "faces_detected": faces_detected,
        "recognized": recognized, "unknown": unknown
    }

@router.get("/{person_id}/photos")
async def get_person_photos(person_id: int, db: Session = Depends(get_db)):
    faces = db.query(Face).filter(Face.person_id == person_id).all()
    photo_ids = [f.photo_id for f in faces]
    photos = db.query(Photo).filter(Photo.id.in_(photo_ids)).all()
    return {"photos": photos}

@router.post("/detect-and-recognize")
async def detect_and_recognize_background(db: Session = Depends(get_db)):
    task = detect_and_recognize_faces.delay()
    return {"message": "Face scanning started", "task_id": task.id}

# --- NEW: Unknown Faces Routes ---
@router.get("/unknown/faces")
async def get_unknown_faces(db: Session = Depends(get_db)):
    """Fetch all faces that haven't been matched yet."""
    faces = db.query(Face).filter(Face.person_id.is_(None)).limit(50).all() # Limit to 50 for UI performance
    result = []
    for f in faces:
        if f.photo:
            result.append({
                "face_id": f.id,
                "photo_id": f.photo_id,
                "file_path": f.photo.file_path,
            })
    return {"faces": result}

@router.post("/faces/{face_id}/tag")
async def tag_face(face_id: int, request: TagFaceRequest, db: Session = Depends(get_db)):
    """Manually assign an unknown face to a person."""
    face = db.query(Face).filter(Face.id == face_id).first()
    if face:
        face.person_id = request.person_id
        db.commit()
        return {"success": True}
    return {"success": False, "error": "Face not found"}