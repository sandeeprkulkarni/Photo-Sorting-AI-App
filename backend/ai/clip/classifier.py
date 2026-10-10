import torch
import clip
from PIL import Image
import numpy as np
from typing import List, Dict

class CLIPClassifier:
    def __init__(self, model_name: str = "ViT-B/32"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load(model_name, device=self.device)
        
        # FIX: Updated prompts to explicitly distinguish digital graphics from real photography
        self.whatsapp_categories = {
            "spam": [
                "promotional advertisement graphic",
                "marketing offer text",
                "scam message screenshot",
            ],
            "greetings": [
                "digital greeting card with text",
                "good morning forward image",
                "happy birthday graphic card",
                "festival celebration graphic poster",
            ],
            "sensitive": [
                "adult content",
                "violent imagery",
            ],
            "useful": [
                "personal photo of people",
                "family gathering celebration",
                "real photograph of friends",
                "people at a festival",
                "party photography",
            ]
        }
    
    def classify_image(self, image_path: str) -> dict:
        """Classify an image into one of the WhatsApp categories."""
        image = Image.open(image_path).convert('RGB')
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)
        
        # Prepare text prompts
        prompt_to_category = {}
        all_prompts = []
        for category, prompts in self.whatsapp_categories.items():
            for prompt in prompts:
                all_prompts.append(prompt)
                # FIX: Map the numerical index to the category so NumPy can read it
                prompt_to_category[len(all_prompts) - 1] = category
                
        text_inputs = clip.tokenize(all_prompts).to(self.device)
        
        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            text_features = self.model.encode_text(text_inputs)
            
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            scores = similarity[0].cpu().numpy()
        
        category_scores = {}
        for category in self.whatsapp_categories.keys():
            category_indices = [
                i for i, cat in prompt_to_category.items() if cat == category
            ]
            category_scores[category] = float(np.max(scores[category_indices]))
        
        best_category = max(category_scores, key=category_scores.get)
        confidence = category_scores[best_category]
        
        return {
            "category": best_category,
            "confidence": confidence,
            "scores": category_scores
        }
    
    def generate_embedding(self, image_path: str) -> np.ndarray:
        image = Image.open(image_path).convert('RGB')
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            embedding = self.model.encode_image(image_input)
            embedding /= embedding.norm(dim=-1, keepdim=True)
            
        return embedding.cpu().numpy()[0]