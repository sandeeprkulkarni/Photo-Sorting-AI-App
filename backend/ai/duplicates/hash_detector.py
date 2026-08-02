import hashlib
from PIL import Image
import imagehash
from typing import List, Dict
from sqlalchemy.orm import Session
from app.database.models import Photo, DuplicateGroup
import uuid

class DuplicateDetector:
    def __init__(self, db: Session):
        self.db = db
    
    def detect_all_duplicates(self) -> List[str]:
        """
        Run all duplicate detection methods.
        Returns list of duplicate group IDs.
        """
        groups = []
        
        # Step 1: Exact hash duplicates
        groups.extend(self.detect_exact_duplicates())
        
        # Step 2: Perceptual hash duplicates
        groups.extend(self.detect_perceptual_duplicates())
        
        # Step 3: Semantic duplicates (CLIP embeddings)
        groups.extend(self.detect_semantic_duplicates())
        
        return groups
    
    def detect_exact_duplicates(self) -> List[str]:
        """Find photos with identical file hashes."""
        from sqlalchemy import func
        
        # Find file hashes that appear more than once
        duplicate_hashes = self.db.query(
            Photo.file_hash,
            func.count(Photo.id).label('count')
        ).group_by(
            Photo.file_hash
        ).having(
            func.count(Photo.id) > 1
        ).all()
        
        group_ids = []
        
        for file_hash, count in duplicate_hashes:
            # Get all photos with this hash
            photos = self.db.query(Photo).filter(
                Photo.file_hash == file_hash
            ).all()
            
            # Create duplicate group
            group_id = str(uuid.uuid4())
            
            # Determine best photo (highest resolution)
            best_photo = max(photos, key=lambda p: p.width * p.height)
            
            # Create group record
            group = DuplicateGroup(
                id=group_id,
                photo_count=len(photos),
                best_photo_id=best_photo.id,
                similarity_score=1.0,
                detection_method="exact_hash"
            )
            self.db.add(group)
            
            # Update photo records
            for photo in photos:
                photo.is_duplicate = True
                photo.duplicate_group_id = group_id
                photo.is_best_in_group = (photo.id == best_photo.id)
            
            group_ids.append(group_id)
        
        self.db.commit()
        return group_ids
    
    def detect_perceptual_duplicates(self, threshold: int = 5) -> List[str]:
        """
        Find photos with similar perceptual hashes.
        threshold: Hamming distance threshold (0-64)
        """
        # Get all photos without duplicate group
        photos = self.db.query(Photo).filter(
            Photo.duplicate_group_id.is_(None)
        ).all()
        
        # Calculate perceptual hashes if not exists
        for photo in photos:
            if not photo.perceptual_hash:
                try:
                    img = Image.open(photo.file_path)
                    phash = str(imagehash.phash(img))
                    photo.perceptual_hash = phash
                except Exception as e:
                    print(f"Error calculating phash for {photo.file_path}: {e}")
        
        self.db.commit()
        
        # Find similar hashes
        group_ids = []
        processed = set()
        
        for i, photo1 in enumerate(photos):
            if photo1.id in processed or not photo1.perceptual_hash:
                continue
            
            similar_photos = [photo1]
            hash1 = imagehash.hex_to_hash(photo1.perceptual_hash)
            
            for photo2 in photos[i+1:]:
                if not photo2.perceptual_hash:
                    continue
                
                hash2 = imagehash.hex_to_hash(photo2.perceptual_hash)
                distance = hash1 - hash2
                
                if distance <= threshold:
                    similar_photos.append(photo2)
                    processed.add(photo2.id)
            
            # If we found duplicates, create a group
            if len(similar_photos) > 1:
                group_id = str(uuid.uuid4())
                
                # Determine best photo based on quality
                best_photo = self._select_best_photo(similar_photos)
                
                group = DuplicateGroup(
                    id=group_id,
                    photo_count=len(similar_photos),
                    best_photo_id=best_photo.id,
                    similarity_score=0.95,
                    detection_method="perceptual_hash"
                )
                self.db.add(group)
                
                for photo in similar_photos:
                    photo.is_duplicate = True
                    photo.duplicate_group_id = group_id
                    photo.is_best_in_group = (photo.id == best_photo.id)
                    processed.add(photo.id)
                
                group_ids.append(group_id)
        
        self.db.commit()
        return group_ids
    
    def detect_semantic_duplicates(self, similarity_threshold: float = 0.95) -> List[str]:
        """
        Find semantically similar photos using CLIP embeddings.
        """
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np
        
        # Get photos with embeddings but no duplicate group
        photos = self.db.query(Photo).filter(
            Photo.duplicate_group_id.is_(None),
            Photo.clip_embedding.isnot(None)
        ).all()
        
        if len(photos) < 2:
            return []
        
        # Convert embeddings to numpy array
        embeddings = np.array([p.clip_embedding for p in photos])
        
        # Calculate cosine similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        
        group_ids = []
        processed = set()
        
        for i in range(len(photos)):
            if i in processed:
                continue
            
            # Find similar photos
            similar_indices = np.where(similarity_matrix[i] > similarity_threshold)[0]
            similar_indices = [idx for idx in similar_indices if idx != i and idx not in processed]
            
            if len(similar_indices) > 0:
                similar_photos = [photos[i]] + [photos[idx] for idx in similar_indices]
                
                group_id = str(uuid.uuid4())
                best_photo = self._select_best_photo(similar_photos)
                
                group = DuplicateGroup(
                    id=group_id,
                    photo_count=len(similar_photos),
                    best_photo_id=best_photo.id,
                    similarity_score=float(np.mean([similarity_matrix[i][idx] for idx in similar_indices])),
                    detection_method="semantic_clip"
                )
                self.db.add(group)
                
                for photo in similar_photos:
                    photo.is_duplicate = True
                    photo.duplicate_group_id = group_id
                    photo.is_best_in_group = (photo.id == best_photo.id)
                    processed.add(photos.index(photo))
                
                group_ids.append(group_id)
        
        self.db.commit()
        return group_ids
    
    def _select_best_photo(self, photos: List[Photo]) -> Photo:
        """
        Select the best photo from a group based on quality metrics.
        """
        # Sort by: quality_score > resolution > file_size
        sorted_photos = sorted(
            photos,
            key=lambda p: (
                p.quality_score or 0,
                (p.width or 0) * (p.height or 0),
                p.file_size or 0
            ),
            reverse=True
        )
        return sorted_photos[0]