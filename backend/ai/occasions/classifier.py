import torch
import clip
from PIL import Image
from typing import Dict
import numpy as np

class OccasionClassifier:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        
        self.occasions = {
            "birthday": [
                "birthday party with cake and candles",
                "birthday celebration",
                "birthday cake cutting"
            ],
            "wedding": [
                "wedding ceremony",
                "bride and groom",
                "wedding reception",
                "marriage celebration"
            ],
            "vacation": [
                "beach vacation",
                "mountain vacation",
                "tourist attraction",
                "travel sightseeing"
            ],
            "festival": [
                "festival celebration",
                "religious festival",
                "cultural festival",
                "holiday celebration"
            ],
            "office": [
                "office meeting",
                "workplace event",
                "business conference",
                "office party"
            ],
            "family_gathering": [
                "family dinner",
                "family reunion",
                "family photo",
                "family gathering"
            ],
            "graduation": [
                "graduation ceremony",
                "graduation cap and gown",
                "degree ceremony"
            ],
            "sports": [
                "sports event",
                "playing sports",
                "athletic activity"
            ],
            "casual": [
                "casual photo",
                "everyday moment",
                "random photo"
            ]
        }
    
    def classify_occasion(self, image_path: str) -> Dict[str, float]:
        """
        Classify image into occasion category.
        """
        image = Image.open(image_path).convert('RGB')
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)
        
        # Prepare prompts
        all_prompts = []
        prompt_to_occasion = {}
        
        for occasion, prompts in self.occasions.items():
            for prompt in prompts:
                all_prompts.append(f"a photo of {prompt}")
                prompt_to_occasion[len(all_prompts) - 1] = occasion
        
        # Encode
        text_inputs = clip.tokenize(all_prompts).to(self.device)
        
        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            text_features = self.model.encode_text(text_inputs)
            
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            scores = similarity[0].cpu().numpy()
        
        # Aggregate by occasion
        occasion_scores = {}
        for occasion in self.occasions.keys():
            indices = [i for i, occ in prompt_to_occasion.items() if occ == occasion]
            occasion_scores[occasion] = float(np.max(scores[indices]))
        
        best_occasion = max(occasion_scores, key=occasion_scores.get)
        
        return {
            "occasion": best_occasion,
            "confidence": occasion_scores[best_occasion],
            "all_scores": occasion_scores
        }