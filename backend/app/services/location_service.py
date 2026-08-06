from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from sqlalchemy.orm import Session
from app.database.models import Photo
import time

class LocationService:
    def __init__(self, db: Session):
        self.db = db
        self.geolocator = Nominatim(user_agent="private-photo-organizer")
    
    def process_locations(self):
        """Process all photos with GPS coordinates."""
        photos = self.db.query(Photo).filter(
            Photo.gps_latitude.isnot(None),
            Photo.location_name.is_(None)
        ).all()
        
        processed = 0
        
        for photo in photos:
            try:
                location_name = self._reverse_geocode(
                    photo.gps_latitude,
                    photo.gps_longitude
                )
                
                if location_name:
                    photo.location_name = location_name
                    processed += 1
                
                # Rate limiting
                time.sleep(1)
                
            except Exception as e:
                print(f"Error geocoding {photo.id}: {e}")
        
        self.db.commit()
        return processed
    
    def _reverse_geocode(self, lat: float, lon: float) -> str:
        """Convert GPS coordinates to location name."""
        try:
            location = self.geolocator.reverse(f"{lat}, {lon}", timeout=10)
            
            if location:
                address = location.raw.get('address', {})
                
                # Extract city/town/village
                place = (
                    address.get('city') or
                    address.get('town') or
                    address.get('village') or
                    address.get('county')
                )
                
                # Extract country
                country = address.get('country')
                
                if place and country:
                    return f"{place}, {country}"
                elif place:
                    return place
                elif country:
                    return country
            
            return None
            
        except GeocoderTimedOut:
            return None