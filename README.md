# Private AI Photo Organizer

A privacy-first desktop application that uses local AI to organize your photo collection. All processing happens on your device with no cloud uploads.

## Features

- 📸 **Smart Photo Import**: Import photos from any directory with automatic metadata extraction
- 🤖 **AI Classification**: Automatically detect and filter out WhatsApp forwards, spam, and greeting images
- 🔍 **Duplicate Detection**: Find exact duplicates, near-duplicates, and semantically similar photos
- 👤 **Face Recognition**: Train the app to recognize people and organize photos by person
- 📍 **Location Detection**: Extract GPS data and organize photos by location
- 🎉 **Occasion Detection**: Automatically categorize photos by events (birthdays, weddings, vacations, etc.)
- ⚡ **Quality Assessment**: Keep only the best quality photos from duplicate sets
- 🔒 **100% Private**: All AI processing happens locally on your machine

## Technology Stack

**Frontend:**
- Electron (Desktop framework)
- React + TypeScript (UI)
- Material-UI (Components)

**Backend:**
- Python + FastAPI (API server)
- SQLite (Database)
- Celery + Redis (Background tasks)

**AI Models:**
- OpenAI CLIP (Image classification)
- InsightFace (Face recognition)
- PaddleOCR (Text extraction)
- Custom quality assessment algorithms

## Prerequisites

- **Node.js**: 18+ (for Electron frontend)
- **Python**: 3.10+ (for AI backend)
- **Redis**: Latest (for task queue)
- **GPU**: NVIDIA GPU with CUDA support (optional, but recommended for speed)
- **RAM**: 8GB minimum, 16GB+ recommended
- **Storage**: 5GB for AI models + space for your photos

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/private-photo-organizer.git
cd private-photo-organizer
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download AI models (this will take a while - ~3GB)
python scripts/download_models.py

# Initialize database
python scripts/setup_database.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

### 4. Start Redis

```bash
# On macOS with Homebrew:
brew services start redis

# On Ubuntu/Debian:
sudo systemctl start redis

# On Windows:
# Download and run Redis from https://github.com/microsoftarchive/redis/releases
```

### 5. Run Development Environment

You'll need 4 terminal windows:

**Terminal 1 - Backend API:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Celery Worker:**
```bash
cd backend
source venv/bin/activate
celery -A app.workers.queue worker --loglevel=info
```

**Terminal 3 - Redis:**
```bash
redis-server
```

**Terminal 4 - Electron App:**
```bash
cd frontend
npm run electron:dev
```

The app should now launch!

## Usage Guide

### 1. Import Photos

1. Click **"Import"** in the sidebar
2. Click **"Select Folder"** and choose your photo directory
3. Wait for import to complete (1000 photos/minute)
4. Photos are analyzed in the background

### 2. Review Classifications

1. Go to **"Review"** page
2. Review AI classifications (spam, greeting, useful, etc.)
3. Keep, reject, or recategorize photos
4. Your feedback helps improve accuracy

### 3. Manage Duplicates

1. Go to **"Duplicates"** page
2. Review duplicate groups side-by-side
3. AI recommends the best photo based on quality
4. Confirm or select a different photo to keep

### 4. Train Face Recognition

1. Go to **"People"** page
2. Click **"Add Person"**
3. Enter person's name
4. Upload 10-20 clear photos of their face
5. Click **"Train"**
6. The app will now recognize this person in all photos

### 5. Browse Organized Photos

- **People**: Browse photos by person
- **Locations**: Browse photos by location (GPS-based)
- **Occasions**: Browse photos by event type

## Project Structure

```
private-photo-organizer/
├── frontend/               # Electron + React app
│   ├── electron/          # Electron main process
│   ├── src/               # React components
│   └── package.json
├── backend/               # Python FastAPI backend
│   ├── app/              # API routes and services
│   ├── ai/               # AI/ML models
│   ├── scripts/          # Setup scripts
│   └── requirements.txt
├── models/               # Downloaded AI models
├── storage/              # User photo storage
└── database/             # SQLite database
```

## Documentation

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed development roadmap
- [Architecture](./ARCHITECTURE.md) - System architecture and design decisions
- [API Documentation](./docs/API.md) - REST API reference (auto-generated at http://localhost:8000/docs)

## Building for Production

### macOS

```bash
cd frontend
npm run dist
# Output: dist-electron/*.dmg
```

### Windows

```bash
cd frontend
npm run dist
# Output: dist-electron/*.exe
```

### Linux

```bash
cd frontend
npm run dist
# Output: dist-electron/*.AppImage
```

## Performance Benchmarks

With NVIDIA RTX 3060 GPU:
- **Import**: 1000 photos/minute
- **CLIP Classification**: 50 photos/second
- **Face Detection**: 20 photos/second
- **Duplicate Detection**: 10,000 photos in 5 minutes

CPU-only performance is ~10x slower but still usable.

## Privacy & Security

- ✅ **No cloud uploads**: All processing happens locally
- ✅ **No telemetry**: We don't track your usage
- ✅ **No external API calls**: Optional reverse geocoding can be disabled
- ✅ **Your data stays yours**: Photos never leave your device

## Supported Photo Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- HEIC (.heic) - Apple Photos
- WebP (.webp)

## System Requirements

**Minimum:**
- CPU: Intel i5 or equivalent
- RAM: 8GB
- Storage: 10GB free space
- OS: Windows 10, macOS 10.14+, Ubuntu 20.04+

**Recommended:**
- CPU: Intel i7 or AMD Ryzen 7
- RAM: 16GB+
- GPU: NVIDIA GPU with 4GB+ VRAM
- Storage: SSD with 50GB+ free space
- OS: Latest version

## Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.10+

# Check if port 8000 is in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

### Face recognition not working

```bash
# Check if InsightFace models are downloaded
ls models/face_models/

# Re-download models
cd backend
python scripts/download_models.py --force
```

### Out of memory errors

- Reduce batch size in `backend/app/config.py`
- Close other applications
- Upgrade RAM
- Enable swap space

### Slow processing

- Enable GPU acceleration (install CUDA toolkit)
- Reduce image processing quality in settings
- Process photos in smaller batches

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Roadmap

- [x] Phase 1: Core infrastructure
- [x] Phase 2: WhatsApp forward detection
- [x] Phase 3: Duplicate detection
- [x] Phase 4: Face recognition
- [x] Phase 5: Location & occasion detection
- [ ] Phase 6: User feedback & learning
- [ ] Phase 7: Performance optimization
- [ ] Phase 8: Video support
- [ ] Phase 9: Mobile apps
- [ ] Phase 10: Optional cloud backup (encrypted)

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Acknowledgments

- [OpenAI CLIP](https://github.com/openai/CLIP) - Image classification
- [InsightFace](https://github.com/deepinsight/insightface) - Face recognition
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) - Text extraction
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Electron](https://www.electronjs.org/) - Desktop framework

## Support

- 📧 Email: support@yourcompany.com
- 💬 Discord: [Join our community](https://discord.gg/yourserver)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/private-photo-organizer/issues)
- 📖 Docs: [Full Documentation](https://docs.yourcompany.com)

## Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourusername](https://twitter.com/yourusername)

---

**⭐ If you find this project useful, please consider giving it a star!**
