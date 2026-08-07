from app.workers.tasks import detect_and_recognize_faces

@router.post("/detect-and-recognize")
async def detect_and_recognize_background(db: Session = Depends(get_db)):
    task = detect_and_recognize_faces.delay()
    return {"message": "Face scanning started", "task_id": task.id}