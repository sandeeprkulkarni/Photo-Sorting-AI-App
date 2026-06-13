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