# System Architecture - Private AI Photo Organizer

## Overview

The Private AI Photo Organizer is a desktop application built with a **client-server architecture** where both the frontend (Electron + React) and backend (Python + FastAPI) run locally on the user's machine. All AI processing happens on-device with no cloud dependencies.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S MACHINE                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Electron Desktop App (Frontend)             │    │
│  │  ┌──────────────┐  ┌─────────────────────────┐    │    │
│  │  │   Main       │  │   Renderer Process       │    │    │
│  │  │   Process    │  │   (React + TypeScript)   │    │    │
│  │  │              │  │                          │    │    │
│  │  │  - Start     │  │  - Dashboard             │    │    │
│  │  │    Backend   │  │  - Import UI             │    │    │
│  │  │  - File      │  │  - Review UI             │    │    │
│  │  │    Dialogs   │  │  - People Management     │    │    │
│  │  │  - IPC       │  │  - Photo Grid            │    │    │
│  │  └──────┬───────┘  └─────────┬───────────────┘    │    │
│  └─────────┼──────────────────────┼──────────────────┘    │
│            │                      │                        │
│            │ IPC                  │ HTTP (localhost:8000)  │
│            │                      │                        │
│  ┌─────────▼──────────────────────▼──────────────────┐    │
│  │         FastAPI Backend (Python)                   │    │
│  │  ┌──────────────────────────────────────────┐    │    │
│  │  │            REST API Layer                 │    │    │
│  │  │  /photos /duplicates /people /locations   │    │    │
│  │  └──────────────┬───────────────────────────┘    │    │
│  │                 │                                 │    │
│  │  ┌──────────────▼───────────────────────────┐    │    │
│  │  │         Service Layer                     │    │    │
│  │  │  - Import Service                         │    │    │
│  │  │  - Classification Service                 │    │    │
│  │  │  - Organization Service                   │    │    │
│  │  └──────────────┬───────────────────────────┘    │    │
│  │                 │                                 │    │
│  │  ┌──────────────▼───────────────────────────┐    │    │
│  │  │         AI/ML Layer                       │    │    │
│  │  │  ┌────────┐  ┌─────────┐  ┌──────────┐  │    │    │
│  │  │  │  CLIP  │  │ Insight │  │ PaddleOCR│  │    │    │
│  │  │  │Classify│  │  Face   │  │   Text   │  │    │    │
│  │  │  └────────┘  └─────────┘  └──────────┘  │    │    │
│  │  │  ┌────────┐  ┌─────────┐  ┌──────────┐  │    │    │
│  │  │  │Quality │  │ Dedupe  │  │ Location │  │    │    │
│  │  │  │ Score  │  │ Detect  │  │  Detect  │  │    │    │
│  │  │  └────────┘  └─────────┘  └──────────┘  │    │    │
│  │  └──────────────────────────────────────────┘    │    │
│  └───────────────────────┬───────────────────────────┘    │
│                          │                                │
│  ┌───────────────────────▼───────────────────────────┐    │
│  │         Background Job Queue (Celery)             │    │
│  │  - Photo Processing Tasks                         │    │
│  │  - Batch Operations                               │    │
│  │  - Progress Tracking                              │    │
│  └───────────────────────┬───────────────────────────┘    │
│                          │                                │
│  ┌───────────────────────▼───────────────────────────┐    │
│  │         Data Layer                                │    │
│  │  ┌──────────────┐    ┌──────────────────────┐    │    │
│  │  │   SQLite     │    │   Redis (Cache +     │    │    │
│  │  │   Database   │    │   Task Queue)        │    │    │
│  │  └──────────────┘    └──────────────────────┘    │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │         File System Storage                        │   │
│  │  - Imported Photos                                 │   │
│  │  - AI Models (downloaded locally)                  │   │
│  │  - Organized Photo Folders                         │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (Electron + React + TypeScript)

**Technology Stack:**
- **Electron**: Cross-platform desktop framework
- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Material-UI**: Component library
- **React Router**: Navigation
- **Axios**: HTTP client

**Responsibilities:**
- Render user interface
- Handle user interactions
- File system access (via Electron APIs)
- Display photos and metadata
- Progress visualization
- Settings management

**Key Processes:**
- **Main Process**: Node.js process that controls the app lifecycle, creates windows, and manages system integration
- **Renderer Process**: Browser context that runs React app (sandboxed for security)
- **Preload Script**: Bridge between main and renderer for secure IPC

### 2. Backend (Python + FastAPI)

**Technology Stack:**
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **SQLAlchemy**: ORM for database
- **Celery**: Distributed task queue
- **Redis**: Message broker and cache

**Responsibilities:**
- REST API endpoints
- Business logic
- Database operations
- Trigger AI processing
- Background job management

**API Design Principles:**
- RESTful endpoints
- JSON request/response
- Async/await for I/O operations
- Error handling with proper HTTP status codes

### 3. AI/ML Pipeline

**Components:**

#### a. CLIP (Contrastive Language-Image Pre-training)
- **Purpose**: Image classification and embedding generation
- **Model**: OpenAI CLIP ViT-B/32
- **Tasks**:
  - WhatsApp forward detection
  - Occasion classification
  - Semantic similarity search
- **Output**: 512-dimensional embedding vector

#### b. InsightFace
- **Purpose**: Face detection and recognition
- **Model**: Buffalo_L (ArcFace)
- **Tasks**:
  - Detect faces in photos
  - Generate face embeddings
  - Match faces to trained people
- **Output**: 512-dimensional face embedding

#### c. PaddleOCR
- **Purpose**: Text extraction from images
- **Tasks**:
  - Extract text from WhatsApp forwards
  - Identify spam keywords
  - Detect greeting messages
- **Output**: Extracted text with confidence scores

#### d. Quality Assessment
- **Methods**:
  - Sharpness (Laplacian variance)
  - Exposure (brightness analysis)
  - Blur detection (gradient magnitude)
  - Resolution scoring
- **Output**: Quality score 0-100

#### e. Duplicate Detection
- **Methods**:
  - Exact hash (MD5/SHA256)
  - Perceptual hash (pHash, dHash)
  - Semantic similarity (CLIP embeddings)
- **Output**: Duplicate groups with similarity scores

### 4. Data Storage

#### a. SQLite Database
**Tables:**
- `photos`: Photo metadata, AI results, quality scores
- `people`: Person profiles with face embeddings
- `faces`: Detected faces with bounding boxes
- `duplicate_groups`: Groups of similar photos
- `user_corrections`: User feedback for learning

**Why SQLite?**
- No separate database server needed
- Perfect for local desktop apps
- Supports up to 500K+ photos efficiently
- ACID compliance
- Full-text search support

#### b. Redis
**Usage:**
- Celery message broker
- Task result backend
- Caching frequently accessed data
- Session storage

#### c. File System
**Storage Organization:**
```
storage/
├── originals/          # Imported photos (never modified)
├── duplicates/         # Detected duplicates
├── rejected/
│   ├── spam/
│   ├── greetings/
│   └── sensitive/
├── people/
│   ├── {person_name}/
│   └── unknown/
├── locations/
│   └── {location_name}/
└── occasions/
    └── {occasion_name}/
```

### 5. Background Processing (Celery)

**Task Queue Design:**
- Asynchronous processing for long-running operations
- Progress tracking with task state updates
- Batch processing for efficiency
- Error handling and retry logic

**Key Tasks:**
- `process_photo_batch`: Process photos through AI pipeline
- `detect_duplicates`: Find duplicate groups
- `organize_photos`: Move photos to organized folders
- `train_person`: Train face recognition for person

## Data Flow

### Photo Import Flow

```
1. User selects folder
   └─> Electron Main Process
       └─> File dialog
           └─> Returns file paths
               └─> Frontend sends to Backend API

2. Backend: POST /api/photos/import
   └─> ImportService
       └─> Walk directory tree
           └─> For each image file:
               ├─> Calculate MD5 hash
               ├─> Check if already imported
               ├─> Extract EXIF metadata
               └─> Create Photo record in DB

3. Background: Trigger processing
   └─> Celery task: process_photo_batch
       └─> For each photo:
           ├─> Quality assessment
           ├─> CLIP classification
           ├─> CLIP embedding generation
           ├─> OCR text extraction
           ├─> Face detection
           └─> Update DB with results

4. Frontend: Poll progress
   └─> GET /api/progress/task/{task_id}
       └─> Update progress bar
```

### Face Recognition Flow

```
1. User creates person profile
   └─> POST /api/people
       └─> Create Person record

2. User uploads training photos
   └─> POST /api/people/train
       └─> FaceDetector.detect_faces()
           └─> Extract face embeddings
               └─> Store in Person.face_embeddings

3. Background: Recognize faces in all photos
   └─> For each photo:
       └─> FaceDetector.detect_faces()
           └─> For each detected face:
               └─> FaceRecognizer.recognize_face()
                   └─> Compare with all person embeddings
                       └─> If similarity > threshold:
                           └─> Create Face record with person_id

4. Organize photos by people
   └─> Copy photos to storage/people/{name}/
```

### Duplicate Detection Flow

```
1. Trigger: POST /api/duplicates/detect
   └─> Celery task: detect_all_duplicates

2. Step 1: Exact hash duplicates
   └─> Group photos by file_hash
       └─> Create DuplicateGroup for matches

3. Step 2: Perceptual hash duplicates
   └─> Calculate pHash for remaining photos
       └─> Compare Hamming distance
           └─> Group photos with distance < threshold

4. Step 3: Semantic duplicates
   └─> Load CLIP embeddings
       └─> Calculate cosine similarity matrix
           └─> Group photos with similarity > 0.95

5. For each group:
   └─> Select best photo based on:
       ├─> Quality score
       ├─> Resolution
       └─> File size

6. Frontend: Review duplicate groups
   └─> GET /api/duplicates/groups
       └─> Display side-by-side comparison
           └─> User confirms or overrides
```

## Communication Protocols

### 1. Frontend ↔ Backend (HTTP)

**Base URL**: `http://localhost:8000`

**Authentication**: None (local-only)

**Request Format**:
```typescript
// Example: Import photos
const response = await axios.post('/api/photos/import', {
  source_path: '/Users/john/Photos'
});
```

**Response Format**:
```json
{
  "imported": 150,
  "skipped": 20,
  "errors": []
}
```

### 2. Main Process ↔ Renderer Process (IPC)

**Pattern**: Request-response via `ipcMain.handle` / `ipcRenderer.invoke`

**Example**:
```typescript
// Preload script
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder')
});

// Renderer
const folderPath = await window.electronAPI.selectFolder();

// Main process
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});
```

### 3. Backend ↔ AI Models (Function Calls)

**Pattern**: Direct Python imports and method calls

**Example**:
```python
from ai.clip.classifier import CLIPClassifier

classifier = CLIPClassifier()
result = classifier.classify_image('/path/to/photo.jpg')
# Returns: {"category": "spam", "confidence": 0.85}
```

### 4. Background Tasks (Celery)

**Pattern**: Async task dispatch and result retrieval

**Example**:
```python
from app.workers.tasks import process_photo_batch

# Dispatch task
task = process_photo_batch.delay([1, 2, 3, 4, 5])

# Check status
result = task.get(timeout=1)
```

## Scalability Considerations

### For 500K+ Photos

**1. Batch Processing**
- Process photos in batches of 100-1000
- Prevents memory overflow
- Allows progress tracking

**2. Database Optimization**
- Indices on frequently queried fields (hash, duplicate_group_id)
- Periodic VACUUM for SQLite
- Consider PostgreSQL for > 1M photos

**3. Vector Database**
- Use Qdrant (local mode) for similarity search at scale
- Store CLIP embeddings in vector DB
- Faster than cosine similarity on full dataset

**4. Caching**
- Cache AI model outputs
- Redis for frequently accessed data
- In-memory LRU cache for hot paths

**5. GPU Acceleration**
- Use CUDA for AI inference
- 10-50x speedup on NVIDIA GPUs
- Fallback to CPU for compatibility

**6. Incremental Processing**
- Only process new/changed photos
- Store processing status in DB
- Resume from failures

## Security & Privacy

### Threat Model

**Assumptions:**
- User's machine is trusted
- Photos contain sensitive personal data
- No network transmission required

**Security Measures:**

1. **No Cloud Communication**
   - All processing happens locally
   - No telemetry or analytics
   - Optional: disable reverse geocoding for full offline

2. **Sandboxed Renderer**
   - Electron renderer process has no direct Node.js access
   - All file operations through IPC to main process
   - Prevents XSS attacks from loading malicious photos

3. **Input Validation**
   - Validate all file paths to prevent directory traversal
   - Sanitize user inputs
   - Type checking with TypeScript and Pydantic

4. **Secure Storage**
   - SQLite database stored locally
   - No plaintext passwords (not needed)
   - Face embeddings are mathematical vectors (not images)

5. **Content Safety**
   - NSFW detection to protect users
   - User controls for sensitive content
   - Secure deletion of rejected photos

## Deployment Architecture

### Development

```
Developer Machine
├─> Terminal 1: FastAPI backend (port 8000)
├─> Terminal 2: Redis server (port 6379)
├─> Terminal 3: Celery worker
└─> Terminal 4: Electron app (loads React from Vite dev server)
```

### Production (Packaged App)

```
User's Machine
└─> Electron App Bundle
    ├─> Electron executable
    ├─> React app (static files)
    ├─> Python environment (embedded)
    │   ├─> FastAPI backend
    │   ├─> Celery worker
    │   └─> AI models
    ├─> Redis server (embedded)
    └─> SQLite database (user data)
```

**Packaging Strategy:**
- Use `electron-builder` to create installers
- Embed Python using `pyinstaller` or bundle venv
- Include pre-downloaded AI models
- Bundle Redis binary for each platform

## Error Handling

### Frontend
- User-friendly error messages
- Retry logic for network requests
- Graceful degradation if backend unavailable

### Backend
- Proper HTTP status codes
- Detailed error logging
- Rollback database transactions on errors

### AI Pipeline
- Fallback if model fails to load
- Skip corrupted images
- Continue processing on individual failures

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Photo import | 1000/min | File I/O bound |
| CLIP classification | 500/min | GPU: 50/s, CPU: 8/s |
| Face detection | 200/min | GPU dependent |
| Duplicate detection | 10K photos in 5min | Using batch comparison |
| Database query | < 100ms | With proper indices |
| UI responsiveness | 60 FPS | Non-blocking background tasks |

## Technology Choices - Rationale

**Why Electron?**
- Cross-platform (Windows, Mac, Linux)
- Access to file system and native APIs
- Familiar web technologies
- Active ecosystem

**Why FastAPI?**
- Fast async Python framework
- Auto-generated API docs
- Type safety with Pydantic
- Easy integration with AI libraries

**Why SQLite?**
- No separate database server
- Perfect for local apps
- Reliable and battle-tested
- Supports full-text search

**Why Celery?**
- Distributed task queue
- Progress tracking
- Error handling and retries
- Scalable if needed

**Why CLIP?**
- Zero-shot classification
- No training data needed
- Versatile for multiple tasks
- State-of-the-art accuracy

**Why InsightFace?**
- Best face recognition accuracy
- Fast inference
- Pre-trained models available
- Active development

## Future Architecture Considerations

### Mobile Apps
- Share backend API (expose over local network)
- React Native for mobile frontend
- Sync via local WiFi

### Cloud Backup (Optional)
- End-to-end encryption before upload
- User controls encryption keys
- Incremental backup

### NAS Integration
- Mount NAS as local storage
- Process photos on NAS
- Multi-device access

### Distributed Processing
- Process photos on multiple machines
- Central database on NAS
- Celery distributed workers
