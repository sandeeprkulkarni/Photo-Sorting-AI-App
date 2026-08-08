from celery import Celery
import os

celery_app = Celery(
    "photo_organizer",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
    include=["app.workers.tasks"]  # This tells the worker where to find the jobs!
)