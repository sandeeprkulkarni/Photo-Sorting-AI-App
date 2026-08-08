from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import photos, duplicates, people, locations, occasions, feedback, progress
from app.database.session import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Private Photo Organizer API")

# CORS for Electron app and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(photos.router, prefix="/api/photos", tags=["photos"])
app.include_router(duplicates.router, prefix="/api/duplicates", tags=["duplicates"])
app.include_router(people.router, prefix="/api/people", tags=["people"])
app.include_router(locations.router, prefix="/api/locations", tags=["locations"])
app.include_router(occasions.router, prefix="/api/occasions", tags=["occasions"])

# Phase 6: Feedback & Learning
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])

# Phase 7: Background Task Progress
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}