#!/usr/bin/env python3
"""Initialize the database."""

import sys
sys.path.insert(0, 'backend')

from app.database.session import engine, Base
from app.database.models import Photo, Person, Face, DuplicateGroup, UserCorrection

def init_db():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database initialized successfully!")

if __name__ == "__main__":
    init_db()