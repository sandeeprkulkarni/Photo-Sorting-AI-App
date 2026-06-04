# Getting Started - Developer Guide

This guide will walk you through setting up the development environment and implementing the first features of the Private AI Photo Organizer.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Download AI Models](#download-ai-models)
3. [Build Phase 1: Core Infrastructure](#build-phase-1-core-infrastructure)
4. [Test Your Implementation](#test-your-implementation)
5. [Next Steps](#next-steps)

---

## Environment Setup

### 1. Install Prerequisites

#### Python 3.10+

**macOS:**
```bash
brew install python@3.10
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip
```

**Windows:**
Download from [python.org](https://www.python.org/downloads/)

#### Node.js 18+

**macOS:**
```bash
brew install node
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

#### Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
Download from [Redis GitHub](https://github.com/microsoftarchive/redis/releases)

#### Git

```bash
# Verify git is installed
git --version

# If not installed:
# macOS: brew install git
# Ubuntu: sudo apt install git
# Windows: Download from git-scm.com
```

### 2. Create Project Structure

```bash
# Create project directory
mkdir private-photo-organizer
cd private-photo-organizer

# Create subdirectories
mkdir -p frontend/electron frontend/src/pages frontend/src/components frontend/src/services frontend/src/store
mkdir -p backend/app/api/routes backend/app/models backend/app/services backend/app/workers backend/app/database backend/ai/clip backend/ai/ocr backend/ai/faces backend/ai/duplicates backend/ai/quality backend/ai/occasions
mkdir -p models/clip models/face_models models/nsfw_models
mkdir -p storage/originals storage/duplicates storage/rejected storage/people storage/locations storage/occasions
mkdir -p database
mkdir -p scripts
mkdir -p docs

# Initialize git
git init
```

### 3. Create .gitignore

Create `.gitignore` in the project root:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
*.egg-info/
.pytest_cache/

# Node
node_modules/
dist/
dist-electron/
.DS_Store

# AI Models (too large for git)
models/
*.pt
*.onnx
*.pth

# User Data
storage/
database/*.db
database/*.db-journal

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
logs/

# Environment
.env
.env.local

# Build artifacts
build/
*.egg
```

---

## Download AI Models

### Create Model Download Script

Create `scripts/download_models.py`:

```python
#!/usr/bin/env python3
"""Download all required AI models."""

import os
import urllib.request
from pathlib import Path

def download_file(url: str, destination: str):
    """Download a file with progress."""
    print(f"Downloading {os.path.basename(destination)}...")
    urllib.request.urlretrieve(url, destination)
    print(f"✓ Downloaded to {destination}")

def download_clip_model():
    """Download CLIP model."""
    import clip
    
    print("\n=== Downloading CLIP Model ===")
    model, preprocess = clip.load("ViT-B/32", device="cpu")
    print("✓ CLIP model loaded and cached")

def download_insightface_models():
    """Download InsightFace models."""
    from insightface.app import FaceAnalysis
    
    print("\n=== Downloading InsightFace Models ===")
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=0, det_size=(640, 640))
    print("✓ InsightFace models downloaded")

def download_paddleocr_models():
    """Download PaddleOCR models."""
    from paddleocr import PaddleOCR
    
    print("\n=== Downloading PaddleOCR Models ===")
    ocr = PaddleOCR(use_angle_cls=True, lang='en')
    print("✓ PaddleOCR models downloaded")

def main():
    print("Private AI Photo Organizer - Model Download Script")
    print("=" * 60)
    print("\nThis will download approximately 3GB of AI models.")
    print("Make sure you have a stable internet connection.\n")
    
    input("Press Enter to continue...")
    
    try:
        download_clip_model()
        download_insightface_models()
        download_paddleocr_models()
        
        print("\n" + "=" * 60)
        print("✓ All models downloaded successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error downloading models: {e}")
        print("Please check your internet connection and try again.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
```

### Run Model Download

```bash
cd backend
source venv/bin/activate
pip install torch torchvision clip insightface paddleocr paddlepaddle

# Download models (this takes 10-30 minutes)
python ../scripts/download_models.py
```

---

## Build Phase 1: Core Infrastructure

### Step 1: Backend Database Setup

Create `backend/app/database/session.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../../database/photos.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Step 2: Create Database Models

Copy the database models from `IMPLEMENTATION_PLAN.md` Phase 1.1 into `backend/app/database/models.py`.

### Step 3: Initialize Database

Create `scripts/setup_database.py`:

```python
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
```

Run it:

```bash
python scripts/setup_database.py
```

### Step 4: Create FastAPI Backend

Create `backend/app/main.py` (see IMPLEMENTATION_PLAN.md Phase 1.2).

Create `backend/app/config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "sqlite:///../../database/photos.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Processing
    BATCH_SIZE: int = 100
    MAX_WORKERS: int = 4
    
    # Storage
    STORAGE_PATH: str = "../../storage"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Step 5: Create Import Service

Copy the `ImportService` from `IMPLEMENTATION_PLAN.md` Phase 1.3 into `backend/app/services/import_service.py`.

### Step 6: Create Photos API Route

Copy the photos router from `IMPLEMENTATION_PLAN.md` Phase 1.4 into `backend/app/api/routes/photos.py`.

### Step 7: Test Backend

```bash
cd backend
source venv/bin/activate

# Start FastAPI server
uvicorn app.main:app --reload --port 8000

# In another terminal, test the API
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Open API docs in browser
open http://localhost:8000/docs
```

### Step 8: Create Electron Main Process

Create `frontend/electron/main.ts`:

```typescript
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

function startBackend() {
  console.log('Starting backend server...');
  
  const pythonPath = process.env.PYTHON_PATH || 'python';
  const backendPath = path.join(__dirname, '../../backend');
  
  backendProcess = spawn(
    pythonPath,
    ['-m', 'uvicorn', 'app.main:app', '--port', '8000'],
    {
      cwd: backendPath,
      env: { ...process.env }
    }
  );
  
  backendProcess.stdout?.on('data', (data) => {
    console.log(`Backend: ${data.toString()}`);
  });
  
  backendProcess.stderr?.on('data', (data) => {
    console.error(`Backend Error: ${data.toString()}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  
  // Wait for backend to start
  setTimeout(() => {
    createWindow();
  }, 3000);
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('select-photos', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'heic', 'webp'] }
    ]
  });
  return result.filePaths;
});
```

### Step 9: Create Preload Script

Create `frontend/electron/preload.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectPhotos: () => ipcRenderer.invoke('select-photos'),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string>;
      selectPhotos: () => Promise<string[]>;
    };
  }
}
```

### Step 10: Create React App Structure

Create `frontend/src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography } from '@mui/material';
import { Home, Upload, Eye, Users, MapPin, Calendar, Settings } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import Review from './pages/Review';
import People from './pages/People';
import Locations from './pages/Locations';
import Occasions from './pages/Occasions';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
  },
});

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Home />, path: '/' },
  { text: 'Import', icon: <Upload />, path: '/import' },
  { text: 'Review', icon: <Eye />, path: '/review' },
  { text: 'People', icon: <Users />, path: '/people' },
  { text: 'Locations', icon: <MapPin />, path: '/locations' },
  { text: 'Occasions', icon: <Calendar />, path: '/occasions' },
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div">
                Private Photo Organizer
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {menuItems.map((item) => (
                  <ListItem button key={item.text} component={Link} to={item.path}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
          
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import" element={<Import />} />
              <Route path="/review" element={<Review />} />
              <Route path="/people" element={<People />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/occasions" element={<Occasions />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
```

### Step 11: Create API Service

Create `frontend/src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Photo endpoints
export const photoAPI = {
  import: (sourcePath: string) => 
    api.post('/photos/import', { source_path: sourcePath }),
  
  list: (skip = 0, limit = 100, status?: string) =>
    api.get('/photos', { params: { skip, limit, status } }),
  
  getById: (id: number) =>
    api.get(`/photos/${id}`),
};

// Add more API endpoints as needed
```

### Step 12: Create Import Page

Copy the Import page component from `IMPLEMENTATION_PLAN.md` Phase 1.5 into `frontend/src/pages/Import.tsx`.

Create placeholder pages for other routes:

```typescript
// frontend/src/pages/Dashboard.tsx
export default function Dashboard() {
  return <div><h1>Dashboard</h1><p>Coming soon...</p></div>;
}

// frontend/src/pages/Review.tsx  
export default function Review() {
  return <div><h1>Review</h1><p>Coming soon...</p></div>;
}

// Similar for People, Locations, Occasions
```

### Step 13: Configure Build Tools

Create `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
```

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Test Your Implementation

### 1. Start All Services

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 4 - Electron:**
```bash
cd frontend
npm run electron:dev
```

### 2. Test Photo Import

1. Launch the Electron app
2. Click "Import" in the sidebar
3. Click "Select Folder"
4. Choose a folder with a few photos
5. Verify photos are imported successfully
6. Check the database:

```bash
sqlite3 database/photos.db
SELECT COUNT(*) FROM photos;
.exit
```

### 3. Verify API

Open http://localhost:8000/docs in your browser and test:
- GET /health
- GET /api/photos
- POST /api/photos/import

---

## Next Steps

Congratulations! You've completed Phase 1. Now you can:

1. **Phase 2**: Implement WhatsApp forward detection
   - Add CLIP classifier
   - Add OCR engine
   - Build review UI

2. **Phase 3**: Implement duplicate detection
   - Hash-based detection
   - Perceptual hashing
   - Quality scoring

3. **Phase 4**: Implement face recognition
   - Face detection
   - Person training
   - Face matching

Refer to `IMPLEMENTATION_PLAN.md` for detailed instructions on each phase.

---

## Common Issues

### Python virtual environment issues

```bash
# Recreate venv
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Redis connection errors

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running:
redis-server
```

### Electron won't start

```bash
# Rebuild Electron
cd frontend
rm -rf node_modules
npm install
```

### CUDA/GPU errors

If you don't have an NVIDIA GPU, use CPU-only versions:

```bash
pip uninstall onnxruntime-gpu paddlepaddle-gpu
pip install onnxruntime paddlepaddle
```

---

## Development Tips

1. **Use Hot Reload**: Both FastAPI (--reload) and Vite support hot reload
2. **Check Logs**: Monitor backend terminal for errors
3. **Use Debugger**: VS Code has great debugging for Python and TypeScript
4. **Test Incrementally**: Test each feature before moving to the next
5. **Commit Often**: Use git to save your progress

## Resources

- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/en/20/tutorial/)

Happy coding! 🚀
