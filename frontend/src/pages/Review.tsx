import React, { useState, useEffect } from 'react';
import { Button, Chip, Grid, Card, CardMedia } from '@mui/material';
import { Check, X } from 'lucide-react';
import { api, API_BASE_URL} from '../services/api';

interface ClassifiedPhoto {
  id: number;
  file_path: string;
  whatsapp_category: string;
  quality_score: number;
}

export default function Review() {
  const [photos, setPhotos] = useState<ClassifiedPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadClassifiedPhotos();
  }, []);

  const loadClassifiedPhotos = async () => {
    const response = await api.get('/photos?status=classified');
    setPhotos(response.data.photos);
  };

  const handleKeep = async () => {
    const photo = photos[currentIndex];
    await api.post(`/photos/${photo.id}/keep`);
    setCurrentIndex(currentIndex + 1);
  };

  const handleReject = async () => {
    const photo = photos[currentIndex];
    await api.post(`/photos/${photo.id}/reject`);
    setCurrentIndex(currentIndex + 1);
  };

  const handleRecategorize = async (newCategory: string) => {
    const photo = photos[currentIndex];
    await api.post(`/photos/${photo.id}/recategorize`, {
      category: newCategory
    });
    setCurrentIndex(currentIndex + 1);
  };

  if (currentIndex >= photos.length) {
    return <div className="p-8">All photos reviewed!</div>;
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
          />
        </Card>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <Chip 
              label={currentPhoto.whatsapp_category || 'Uncategorized'} 
              color={
                currentPhoto.whatsapp_category === 'useful' ? 'success' :
                currentPhoto.whatsapp_category === 'spam' ? 'error' :
                'warning'
              }
            />
            <span className="ml-2">
              Confidence: {currentPhoto.quality_score ? `${(currentPhoto.quality_score * 100).toFixed(1)}%` : 'N/A'}
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

        <div className="mt-4">
          <p className="mb-2">Recategorize as:</p>
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

        <p className="mt-4 text-gray-600">
          Photo {currentIndex + 1} of {photos.length}
        </p>
      </div>
    </div>
  );
}