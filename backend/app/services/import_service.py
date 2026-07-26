import os
import hashlib
from pathlib import Path
from PIL import Image
import piexif
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.models import Photo

class ImportService:
    def __init__(self, db: Session):
        self.db = db
        
    async def import_photos(self, source_path: str) -> dict:
        """
        Import photos from a directory.
        Returns: {imported: int, skipped: int, errors: list}
        """
        results = {"imported": 0, "skipped": 0, "errors": []}
        
        # Supported image extensions
        extensions = {'.jpg', '.jpeg', '.png', '.heic', '.webp'}
        
        # Walk through directory
        for root, dirs, files in os.walk(source_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                ext = Path(filename).suffix.lower()
                
                if ext not in extensions:
                    continue
                
                try:
                    # Check if already imported
                    file_hash = self._calculate_hash(file_path)
                    existing = self.db.query(Photo).filter(
                        Photo.file_hash == file_hash
                    ).first()
                    
                    if existing:
                        results["skipped"] += 1
                        continue
                    
                    # Extract metadata
                    metadata = self._extract_metadata(file_path)
                    
                    # Create photo record
                    photo = Photo(
                        file_path=file_path,
                        original_filename=filename,
                        file_hash=file_hash,
                        **metadata
                    )
                    
                    self.db.add(photo)
                    results["imported"] += 1
                    
                except Exception as e:
                    results["errors"].append({
                        "file": filename,
                        "error": str(e)
                    })
        
        self.db.commit()
        return results
    
    def _calculate_hash(self, file_path: str) -> str:
        """Calculate MD5 hash of file."""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def _extract_metadata(self, file_path: str) -> dict:
        """Extract EXIF and basic metadata."""
        metadata = {}
        
        try:
            # Get file stats
            stat = os.stat(file_path)
            metadata["file_size"] = stat.st_size
            
            # Open image
            img = Image.open(file_path)
            metadata["width"] = img.width
            metadata["height"] = img.height
            
            # Extract EXIF
            if hasattr(img, '_getexif') and img._getexif():
                exif_dict = piexif.load(img.info.get('exif', b''))
                
                # Camera info
                if '0th' in exif_dict:
                    metadata["camera_make"] = exif_dict['0th'].get(271, b'').decode('utf-8', errors='ignore')
                    metadata["camera_model"] = exif_dict['0th'].get(272, b'').decode('utf-8', errors='ignore')
                
                # GPS data
                if 'GPS' in exif_dict:
                    gps = exif_dict['GPS']
                    if 2 in gps and 4 in gps:
                        metadata["gps_latitude"] = self._convert_gps(gps[2])
                        metadata["gps_longitude"] = self._convert_gps(gps[4])
                
                # Date taken
                if 'Exif' in exif_dict and 36867 in exif_dict['Exif']:
                    date_str = exif_dict['Exif'][36867].decode('utf-8')
                    metadata["taken_date"] = datetime.strptime(
                        date_str, '%Y:%m:%d %H:%M:%S'
                    )
            
        except Exception as e:
            print(f"Error extracting metadata from {file_path}: {e}")
        
        return metadata
    
    def _convert_gps(self, gps_tuple):
        """Convert GPS coordinates from EXIF format to decimal."""
        degrees = gps_tuple[0][0] / gps_tuple[0][1]
        minutes = gps_tuple[1][0] / gps_tuple[1][1]
        seconds = gps_tuple[2][0] / gps_tuple[2][1]
        return degrees + (minutes / 60.0) + (seconds / 3600.0)