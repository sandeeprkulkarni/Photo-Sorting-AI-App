from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import photos
#, people, locations, occasions
#from app.core.database import Base, engine
from app.database.session import engine
from app.database.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Photo Sorting AI API",
    description="AI-powered photo organization backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(photos.router, prefix="/api/photos", tags=["photos"])
#app.include_router(people.router, prefix="/api/people", tags=["people"])
#app.include_router(locations.router, prefix="/api/locations", tags=["locations"])
#app.include_router(occasions.router, prefix="/api/occasions", tags=["occasions"])


@app.get("/health")
def health_check():
    return {"status":"healthy"}