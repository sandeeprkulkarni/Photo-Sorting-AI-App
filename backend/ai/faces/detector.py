from insightface.app import FaceAnalysis
import numpy as np
from typing import List, Dict
from PIL import Image

class FaceDetector:
    def __init__(self):
        # Initialize InsightFace model
        self.app = FaceAnalysis(
            name='buffalo_l',
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
        )
        self.app.prepare(ctx_id=0, det_size=(640, 640))
    
    def detect_faces(self, image_path: str) -> List[Dict]:
        """
        Detect all faces in an image.
        Returns: [{
            "bbox": [x, y, width, height],
            "embedding": [...],
            "confidence": 0.99,
            "quality": 0.95
        }]
        """
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            return []
        
        # Detect faces
        faces = self.app.get(img)
        
        results = []
        for face in faces:
            bbox = face.bbox.astype(int)
            
            results.append({
                "bbox": [
                    int(bbox[0]),  # x
                    int(bbox[1]),  # y
                    int(bbox[2] - bbox[0]),  # width
                    int(bbox[3] - bbox[1])   # height
                ],
                "embedding": face.embedding.tolist(),
                "confidence": float(face.det_score),
                "quality": self._calculate_face_quality(face, img)
            })
        
        return results
    
    def _calculate_face_quality(self, face, img) -> float:
        """Calculate face quality score."""
        # Factors: size, sharpness, frontality, occlusion
        bbox = face.bbox.astype(int)
        face_width = bbox[2] - bbox[0]
        face_height = bbox[3] - bbox[1]
        
        # Size score (larger faces are better)
        img_area = img.shape[0] * img.shape[1]
        face_area = face_width * face_height
        size_ratio = face_area / img_area
        size_score = min(1.0, size_ratio * 10)  # 10% of image = perfect
        
        # Pose score (frontal faces are better)
        pose = face.pose
        if pose is not None:
            pitch, yaw, roll = pose
            pose_score = 1.0 - (abs(pitch) + abs(yaw)) / 90
        else:
            pose_score = 0.8
        
        # Overall quality
        quality = (size_score * 0.5 + pose_score * 0.5)
        return quality