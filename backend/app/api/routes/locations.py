from app.workers.tasks import process_all_locations

@router.post("/process")
async def process_locations_background(db: Session = Depends(get_db)):
    task = process_all_locations.delay()
    return {"message": "Location processing started", "task_id": task.id}