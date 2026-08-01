import torch
from paddleocr import PaddleOCR
from typing import List, Dict
import re

class OCREngine:
    def __init__(self):
        # Initialize PaddleOCR
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang='en',
            enable_mkldnn=False
        )
        
        # Spam keywords
        self.spam_keywords = [
            'investment', 'crypto', 'bitcoin', 'earn money', 'click here',
            'limited offer', 'act now', 'exclusive deal', 'guaranteed',
            'free gift', 'winner', 'congratulations', 'claim now',
            'WhatsApp Group', 'Forward this', 'Share with 10 friends'
        ]
        
        self.greeting_keywords = [
            'good morning', 'good night', 'happy birthday', 'anniversary',
            'diwali', 'eid mubarak', 'merry christmas', 'happy new year',
            'success quotes', 'motivational'
        ]
    
    def extract_text(self, image_path: str) -> Dict:
        """
        Extract text from image.
        Returns: {"text": "...", "confidence": 0.95, "boxes": [...]}
        """
        result = self.ocr.ocr(image_path)
        
        if not result or not result[0]:
            return {"text": "", "confidence": 0.0, "boxes": []}
        
        # Extract text and boxes
        texts = []
        confidences = []
        boxes = []
        
        for line in result[0]:
            box = line[0]
            text_info = line[1]
            text = text_info[0]
            confidence = text_info[1]
            
            texts.append(text)
            confidences.append(confidence)
            boxes.append(box)
        
        full_text = " ".join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return {
            "text": full_text,
            "confidence": avg_confidence,
            "boxes": boxes,
            "is_spam": self._is_spam_text(full_text),
            "is_greeting": self._is_greeting_text(full_text)
        }
    
    def _is_spam_text(self, text: str) -> bool:
        """Check if text contains spam keywords."""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.spam_keywords)
    
    def _is_greeting_text(self, text: str) -> bool:
        """Check if text contains greeting keywords."""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.greeting_keywords)