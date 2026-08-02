import React, { useState } from 'react';
import { Card, CardMedia, Button, Grid, Chip } from '@mui/material';
import { Check, X } from 'lucide-react';

interface Photo {
  id: number;
  file_path: string;
  quality_score: number;
  width: number;
  height: number;
  file_size: number;
  is_best_in_group: boolean;
}

interface DuplicateGroup {
  id: string;
  photos: Photo[];
  similarity_score: number;
}

export default function DuplicateCompare({ group }: { group: DuplicateGroup }) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(
    group.photos.find(p => p.is_best_in_group)?.id || null
  );

  const handleKeepSelection = async () => {
    // API call to update best photo
    await api.post(`/duplicates/${group.id}/set-best`, {
      photo_id: selectedPhoto
    });
  };

  return (
    <div className="p-6 border rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Duplicate Group</h3>
        <Chip 
          label={`${(group.similarity_score * 100).toFixed(0)}% similar`}
          size="small"
        />
      </div>

      <Grid container spacing={2}>
        {group.photos.map(photo => (
          <Grid item xs={12} md={6} lg={4} key={photo.id}>
            <Card 
              className={selectedPhoto === photo.id ? 'border-4 border-blue-500' : ''}
              onClick={() => setSelectedPhoto(photo.id)}
            >
              <CardMedia
                component="img"
                image={`file://${photo.file_path}`}
                alt="Photo"
                style={{ height: 200, objectFit: 'cover' }}
              />
              <div className="p-2">
                <p className="text-sm">Quality: {photo.quality_score.toFixed(1)}</p>
                <p className="text-xs text-gray-600">
                  {photo.width} × {photo.height} • {(photo.file_size / 1024 / 1024).toFixed(1)} MB
                </p>
                {photo.is_best_in_group && (
                  <Chip label="AI Recommended" size="small" color="primary" />
                )}
              </div>
            </Card>
          </Grid>
        ))}
      </Grid>

      <div className="mt-4 flex justify-end">
        <Button
          variant="contained"
          onClick={handleKeepSelection}
          disabled={!selectedPhoto}
        >
          Keep Selected
        </Button>
      </div>
    </div>
  );
}