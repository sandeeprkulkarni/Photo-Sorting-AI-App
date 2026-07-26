from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.import_service import ImportService
from pydantic import BaseModel

router = APIRouter()

class ImportRequest(BaseModel):
    source_path: str

@router.post("/import")
async def import_photos(
    request: ImportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Import photos from a directory."""
    service = ImportService(db)
    results = await service.import_photos(request.source_path)
    
    # Trigger background processing
    background_tasks.add_task(process_imported_photos, db)
    
    return results

@router.get("/")
async def get_photos(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get list of photos."""
    from app.database.models import Photo
    
    query = db.query(Photo)
    if status:
        query = query.filter(Photo.status == status)
    
    photos = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "photos": photos,
        "total": total,
        "skip": skip,
        "limit": limit
    }

async def process_imported_photos(db: Session):
    """Background task to process newly imported photos."""
    # This will be implemented in later phases
    pass