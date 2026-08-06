import React, { useState, useEffect } from 'react';
import { Button, Chip, Card, CardMedia } from '@mui/material';
import { Check, X } from 'lucide-react';
import { api, API_BASE_URL } from '../services/api';

interface ClassifiedPhoto {
  id: number;
  file_path: string;
  category: string;
  confidence: number;
}

export default function Review() {
  const [photos, setPhotos] = useState<ClassifiedPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadClassifiedPhotos();
  }, []);

  const loadClassifiedPhotos = async () => {
    try {
      const response = await api.get('/photos?status=classified');
      setPhotos(response.data.photos);
    } catch (error) {
      console.error("Failed to fetch classified photos", error);
    }
  };

  // Phase 6: Centralized Feedback Handler
  const handleRecategorize = async (newCategory: string) => {
    const photo = photos[currentIndex];
    try {
      await api.post('/feedback/', {
        photo_id: photo.id,
        correction_type: 'category',
        original_value: photo.category || 'unknown',
        corrected_value: newCategory
      });
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error("Failed to submit feedback", error);
      alert("Error submitting feedback. Check console.");
    }
  };

  const handleKeep = async () => {
    // Confirm the AI's original choice is correct
    const photo = photos[currentIndex];
    await handleRecategorize(photo.category || 'useful');
  };

  const handleReject = async () => {
    // Mark for manual review if rejected without a specific category
    await handleRecategorize('rejected_needs_review');
  };

  if (currentIndex >= photos.length && photos.length > 0) {
    return <div className="p-8 text-xl font-semibold">All photos reviewed!</div>;
  }

  if (photos.length === 0) {
    return <div className="p-8 text-xl text-gray-500">No photos pending review.</div>;
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Review Classifications</h1>
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardMedia
            component="img"
            image={`${API_BASE_URL}/photos/${currentPhoto.id}/image`}
            alt="Photo"
            style={{ maxHeight: 600, objectFit: 'contain' }}
            onError={(e) => {
              // Fallback to local file path if the API endpoint fails
              (e.target as HTMLImageElement).src = `file://${currentPhoto.file_path}`;
            }}
          />
        </Card>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <Chip 
              label={currentPhoto.category || 'unclassified'} 
              color={
                currentPhoto.category === 'useful' ? 'success' :
                currentPhoto.category === 'spam' ? 'error' :
                'warning'
              }
            />
            <span className="ml-2 font-medium">
              Confidence: {((currentPhoto.confidence || 0) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="space-x-2">
            <Button
              variant="contained"
              color="success"
              startIcon={<Check />}
              onClick={handleKeep}
            >
              Keep
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<X />}
              onClick={handleReject}
            >
              Reject
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <p className="mb-3 font-semibold text-gray-700">Recategorize as:</p>
          <div className="space-x-2">
            {['spam', 'greetings', 'sensitive', 'useful'].map(cat => (
              <Button
                key={cat}
                variant="outlined"
                onClick={() => handleRecategorize(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-gray-500">
          Photo {currentIndex + 1} of {photos.length}
        </p>
      </div>
    </div>
  );
}