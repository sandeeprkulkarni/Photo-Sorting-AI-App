from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_status():
    """Placeholder route until full implementation."""
    return {"status": "Not implemented yet. Coming in later phases!"}