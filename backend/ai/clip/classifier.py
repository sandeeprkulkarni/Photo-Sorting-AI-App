import torch
import clip
from PIL import Image
import numpy as np
from typing import List, Dict

class CLIPClassifier:
    def __init__(self, model_name: str = "ViT-B/32"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load(model_name, device=self.device)
        
        # Define classification prompts
        self.whatsapp_categories = {
            "spam": [
                "promotional advertisement",
                "marketing offer",
                "cryptocurrency investment",
                "fake job offer",
                "scam message",
                "phishing attempt",
                "click bait",
            ],
            "greetings": [
                "good morning message",
                "good night message",
                "happy birthday greeting",
                "anniversary wishes",
                "festival celebration image",
                "motivational quote",
                "religious blessing",
            ],
            "sensitive": [
                "adult content",
                "violent imagery",
                "disturbing content",
            ],
            "useful": [
                "personal photo",
                "family photo",
                "travel photo",
                "document scan",
                "screenshot",
                "food photo",
                "nature photo",
            ]
        }
    
    def classify_image(self, image_path: str) -> Dict[str, float]:
        """
        Classify image into WhatsApp categories.
        Returns: {"category": "spam", "confidence": 0.85, "scores": {...}}
        """
        # Load and preprocess image
        image = Image.open(image_path).convert('RGB')
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)
        
        # Prepare all prompts
        all_prompts = []
        prompt_to_category = {}
        
        for category, prompts in self.whatsapp_categories.items():
            for prompt in prompts:
                all_prompts.append(f"a photo of {prompt}")
                prompt_to_category[len(all_prompts) - 1] = category
        
        # Encode prompts
        text_inputs = clip.tokenize(all_prompts).to(self.device)
        
        # Calculate similarities
        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            text_features = self.model.encode_text(text_inputs)
            
            # Normalize features
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            # Calculate cosine similarity
            similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            scores = similarity[0].cpu().numpy()
        
        # Aggregate scores by category
        category_scores = {}
        for category in self.whatsapp_categories.keys():
            category_indices = [
                i for i, cat in prompt_to_category.items() if cat == category
            ]
            category_scores[category] = float(np.max(scores[category_indices]))
        
        # Determine best category
        best_category = max(category_scores, key=category_scores.get)
        confidence = category_scores[best_category]
        
        return {
            "category": best_category,
            "confidence": confidence,
            "scores": category_scores
        }
    
    def generate_embedding(self, image_path: str) -> np.ndarray:
        """Generate CLIP embedding for semantic similarity."""
        image = Image.open(image_path).convert('RGB')
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            embedding = self.model.encode_image(image_input)
            embedding /= embedding.norm(dim=-1, keepdim=True)
        
        return embedding.cpu().numpy()[0]