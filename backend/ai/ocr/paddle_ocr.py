import torch
from paddleocr import PaddleOCR
from typing import List, Dict
from PIL import Image
import math

class OCREngine:
    def __init__(self):
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=False)
        
        self.spam_keywords = [
            'investment', 'crypto', 'bitcoin', 'earn money', 'click here',
            'limited offer', 'act now', 'exclusive deal', 'guaranteed',
            'free gift', 'winner', 'congratulations', 'claim now',
            'whatsapp group', 'forward this', 'share with 10'
        ]
        
        self.greeting_keywords = [
            'good morning', 'good night', 'happy birthday', 'anniversary',
            'diwali', 'eid mubarak', 'merry christmas', 'happy new year',
            'success quotes', 'motivational'
        ]
    
    def extract_text(self, image_path: str) -> Dict:
        """Extract text and calculate the text-to-image area ratio."""
        try:
            result = self.ocr.ocr(image_path)
        except Exception:
            result = None
            
        # Determine image size
        try:
            with Image.open(image_path) as img:
                img_area = img.width * img.height
        except Exception:
            img_area = 1
            
        # FIX: Bulletproof type checking to prevent string iteration crashes
        if not result or not isinstance(result, list) or not result[0] or not isinstance(result[0], list):
            return {"text": "", "confidence": 0.0, "boxes": [], "is_spam": False, "is_greeting": False, "text_area_ratio": 0.0}
        
        texts = []
        confidences = []
        boxes = []
        total_text_area = 0.0
        
        for line in result[0]:
            # Extra safeguard: ensure the line is actually a data pair
            if not isinstance(line, (list, tuple)) or len(line) < 2:
                continue
                
            box = line[0]
            text_info = line[1]
            
            # Safeguard text_info format
            if not isinstance(text_info, (list, tuple)) or len(text_info) < 2:
                continue
                
            texts.append(str(text_info[0]))
            
            # Handle confidence score safely
            try:
                confidences.append(float(text_info[1]))
            except (ValueError, TypeError):
                confidences.append(0.0)
                
            boxes.append(box)
            
            # Calculate the physical area of the text bounding box
            try:
                width = math.dist(box[0], box[1])
                height = math.dist(box[1], box[2])
                total_text_area += (width * height)
            except Exception:
                pass
        
        full_text = " ".join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        text_area_ratio = total_text_area / img_area if img_area > 0 else 0.0
        
        is_text_heavy = text_area_ratio > 0.03
        
        return {
            "text": full_text,
            "confidence": avg_confidence,
            "boxes": boxes,
            "is_spam": self._is_spam_text(full_text) and is_text_heavy,
            "is_greeting": self._is_greeting_text(full_text) and is_text_heavy,
            "text_area_ratio": text_area_ratio
        }
    
    def _is_spam_text(self, text: str) -> bool:
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.spam_keywords)
        
    def _is_greeting_text(self, text: str) -> bool:
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.greeting_keywords)