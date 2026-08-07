from app.workers.tasks import classify_all_occasions

@router.post("/classify")
async def classify_occasions_background(db: Session = Depends(get_db)):
    task = classify_all_occasions.delay()
    return {"message": "Occasion classification started", "task_id": task.id}