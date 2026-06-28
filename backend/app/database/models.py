from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .session import Base

class Photo(Base):
    __tablename__ = "photos"
    
    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String, unique=True, nullable=False)
    original_filename = Column(String)
    file_hash = Column(String, index=True)  # MD5/SHA256
    perceptual_hash = Column(String, index=True)  # pHash
    
    # Metadata
    width = Column(Integer)
    height = Column(Integer)
    file_size = Column(Integer)
    taken_date = Column(DateTime)
    imported_date = Column(DateTime, default=datetime.utcnow)
    
    # EXIF data
    camera_make = Column(String)
    camera_model = Column(String)
    gps_latitude = Column(Float)
    gps_longitude = Column(Float)
    location_name = Column(String)
    
    # Quality metrics
    quality_score = Column(Float)  # 0-100
    sharpness = Column(Float)
    exposure = Column(Float)
    blur_score = Column(Float)
    
    # Classifications
    is_whatsapp_forward = Column(Boolean, default=False)
    whatsapp_category = Column(String)  # spam, greeting, sensitive, useful
    
    is_duplicate = Column(Boolean, default=False)
    duplicate_group_id = Column(String)
    is_best_in_group = Column(Boolean, default=True)
    
    # AI embeddings (stored as JSON for simplicity, use vector DB for scale)
    clip_embedding = Column(JSON)
    
    # Organization
    occasion = Column(String)
    location = Column(String)
    
    # Status
    status = Column(String, default="pending")  # pending, processed, rejected, organized
    
    # Relationships
    faces = relationship("Face", back_populates="photo")
    user_corrections = relationship("UserCorrection", back_populates="photo")


class Person(Base):
    __tablename__ = "people"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    face_embeddings = Column(JSON)  # List of embeddings from training photos
    photo_count = Column(Integer, default=0)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    faces = relationship("Face", back_populates="person")


class Face(Base):
    __tablename__ = "faces"
    
    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(Integer, ForeignKey("photos.id"))
    person_id = Column(Integer, ForeignKey("people.id"), nullable=True)
    
    # Face location in image
    bbox_x = Column(Integer)
    bbox_y = Column(Integer)
    bbox_width = Column(Integer)
    bbox_height = Column(Integer)
    
    # Face embedding
    embedding = Column(JSON)
    confidence = Column(Float)
    
    # Face quality
    quality_score = Column(Float)
    
    photo = relationship("Photo", back_populates="faces")
    person = relationship("Person", back_populates="faces")


class DuplicateGroup(Base):
    __tablename__ = "duplicate_groups"
    
    id = Column(String, primary_key=True)  # UUID
    photo_count = Column(Integer)
    best_photo_id = Column(Integer, ForeignKey("photos.id"))
    similarity_score = Column(Float)
    detection_method = Column(String)  # hash, perceptual, semantic


class UserCorrection(Base):
    __tablename__ = "user_corrections"
    
    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(Integer, ForeignKey("photos.id"))
    correction_type = Column(String)  # occasion, location, person, category
    original_value = Column(String)
    corrected_value = Column(String)
    correction_date = Column(DateTime, default=datetime.utcnow)
    
    photo = relationship("Photo", back_populates="user_corrections")