import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.models import Person, Face

class FaceRecognizer:
    def __init__(self, db: Session):
        self.db = db
        self.similarity_threshold = 0.6  # Cosine similarity threshold
    
    def recognize_face(self, face_embedding: List[float]) -> Optional[Dict]:
        """
        Recognize a face by comparing against trained people.
        Returns: {
            "person_id": 123,
            "person_name": "Rahul",
            "confidence": 0.85
        } or None if no match
        """
        # Get all trained people
        people = self.db.query(Person).all()
        
        if not people:
            return None
        
        best_match = None
        best_similarity = 0.0
        
        for person in people:
            if not person.face_embeddings:
                continue
            
            # Compare with all embeddings for this person
            similarities = []
            for stored_embedding in person.face_embeddings:
                sim = cosine_similarity(
                    [face_embedding],
                    [stored_embedding]
                )[0][0]
                similarities.append(sim)
            
            # Use maximum similarity
            max_sim = max(similarities)
            
            if max_sim > best_similarity:
                best_similarity = max_sim
                best_match = person
        
        # Check if similarity exceeds threshold
        if best_similarity >= self.similarity_threshold:
            return {
                "person_id": best_match.id,
                "person_name": best_match.name,
                "confidence": float(best_similarity)
            }
        
        return None
    
    def train_person(self, person_id: int, training_photos: List[str]) -> bool:
        """
        Train a person profile with example photos.
        """
        from ai.faces.detector import FaceDetector
        
        detector = FaceDetector()
        person = self.db.query(Person).filter(Person.id == person_id).first()
        
        if not person:
            return False
        
        # Detect faces in all training photos
        all_embeddings = []
        
        for photo_path in training_photos:
            faces = detector.detect_faces(photo_path)
            
            if not faces:
                continue
            
            # Use the highest quality face
            best_face = max(faces, key=lambda f: f["quality"])
            all_embeddings.append(best_face["embedding"])
        
        if len(all_embeddings) < 3:
            raise ValueError("Need at least 3 clear face photos for training")
        
        # Store embeddings
        person.face_embeddings = all_embeddings
        self.db.commit()
        
        return True