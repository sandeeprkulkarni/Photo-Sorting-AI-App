import cv2
import numpy as np
from PIL import Image
from typing import Dict

class QualityScorer:
    def __init__(self):
        pass
    
    def assess_quality(self, image_path: str) -> Dict[str, float]:
        """
        Assess image quality across multiple metrics.
        Returns: {
            "overall_score": 75.5,
            "sharpness": 80.0,
            "exposure": 70.0,
            "blur_score": 15.0,
            "resolution_score": 85.0
        }
        """
        img = cv2.imread(image_path)
        
        if img is None:
            return self._default_scores()
        
        # Calculate individual metrics
        sharpness = self._calculate_sharpness(img)
        exposure = self._calculate_exposure(img)
        blur_score = self._calculate_blur(img)
        resolution = self._calculate_resolution_score(img)
        
        # Calculate overall score (weighted average)
        overall = (
            sharpness * 0.3 +
            exposure * 0.2 +
            (100 - blur_score) * 0.3 +
            resolution * 0.2
        )
        
        return {
            "overall_score": overall,
            "sharpness": sharpness,
            "exposure": exposure,
            "blur_score": blur_score,
            "resolution_score": resolution
        }
    
    def _calculate_sharpness(self, img: np.ndarray) -> float:
        """Calculate sharpness using Laplacian variance."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Normalize to 0-100 scale
        score = min(100, (laplacian_var / 500) * 100)
        return score
    
    def _calculate_exposure(self, img: np.ndarray) -> float:
        """Calculate exposure quality (penalize over/under exposure)."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        
        # Ideal brightness is around 127
        deviation = abs(127 - mean_brightness)
        score = max(0, 100 - (deviation / 127) * 100)
        
        return score
    
    def _calculate_blur(self, img: np.ndarray) -> float:
        """Calculate blur amount (lower is better)."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Use gradient magnitude
        gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        magnitude = np.sqrt(gx**2 + gy**2)
        
        # High blur = low gradient magnitude
        blur_amount = 100 - min(100, (np.mean(magnitude) / 50) * 100)
        return blur_amount
    
    def _calculate_resolution_score(self, img: np.ndarray) -> float:
        """Score based on resolution (higher megapixels = better)."""
        height, width = img.shape[:2]
        megapixels = (height * width) / 1_000_000
        
        # Score: 12MP+ = 100, 8MP = 85, 4MP = 70, 1MP = 50
        if megapixels >= 12:
            return 100
        elif megapixels >= 8:
            return 85
        elif megapixels >= 4:
            return 70
        elif megapixels >= 1:
            return 50 + (megapixels - 1) / 3 * 20
        else:
            return 30 + megapixels * 20
    
    def _default_scores(self) -> Dict[str, float]:
        """Return default scores for invalid images."""
        return {
            "overall_score": 0.0,
            "sharpness": 0.0,
            "exposure": 0.0,
            "blur_score": 100.0,
            "resolution_score": 0.0
        }