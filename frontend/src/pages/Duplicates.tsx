import React, { useState, useEffect } from 'react';
import { Button, Chip, Grid, Card, CardMedia, CircularProgress } from '@mui/material';
import { RefreshCw, Check, Layers, X } from 'lucide-react';
import { api } from '../services/api';

interface Photo {
  id: number;
  file_path: string;
  quality_score: number | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  is_best_in_group: boolean;
}

interface DuplicateGroup {
  id: string;
  similarity_score: number;
  detection_method: string;
  photos: Photo[];
}

export default function Duplicates() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{ [groupId: string]: number }>({});

  useEffect(() => {
    loadDuplicateGroups();
  }, []);

  const loadDuplicateGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/duplicates/groups');
      const fetchedGroups: DuplicateGroup[] = response.data.groups || [];
      setGroups(fetchedGroups);

      // Pre-select the recommended photo for each group
      const initialSelections: { [groupId: string]: number } = {};
      fetchedGroups.forEach(group => {
        const bestPhoto = group.photos.find(p => p.is_best_in_group) || group.photos[0];
        if (bestPhoto) {
          initialSelections[group.id] = bestPhoto.id;
        }
      });
      setSelectedPhotos(initialSelections);
    } catch (error) {
      console.error('Failed to fetch duplicate groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDetection = async () => {
    setDetecting(true);
    try {
      await api.post('/duplicates/detect');
      await loadDuplicateGroups();
    } catch (error) {
      console.error('Duplicate detection failed:', error);
    } finally {
      setDetecting(false);
    }
  };

  const handleSelectPhoto = (groupId: string, photoId: number) => {
    setSelectedPhotos(prev => ({ ...prev, [groupId]: photoId }));
  };

  const handleKeepSelected = async (groupId: string) => {
    const photoId = selectedPhotos[groupId];
    if (!photoId) return;

    try {
      await api.post(`/duplicates/${groupId}/set-best`, { photo_id: photoId });
      // Refresh list after selection
      await loadDuplicateGroups();
    } catch (error) {
      console.error('Failed to update best photo:', error);
    }
  };

  const handleRejectAll = async (groupId: string) => {
    try {
      await api.post(`/duplicates/${groupId}/reject-all`);
      // Refresh list after rejecting
      await loadDuplicateGroups();
    } catch (error) {
      console.error('Failed to reject photos:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Duplicate Photo Review</h1>
          <p className="text-gray-600">Review AI-detected duplicate and similar photos.</p>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={detecting ? <CircularProgress size={20} color="inherit" /> : <RefreshCw />}
          onClick={handleRunDetection}
          disabled={detecting}
        >
          {detecting ? 'Scanning for Duplicates...' : 'Run Duplicate Scanner'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <CircularProgress />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border">
          <Layers className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No Duplicates Found</h3>
          <p className="text-gray-500 mt-1">
            Click "Run Duplicate Scanner" above to analyze your photo collection.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group, index) => (
            <div key={group.id} className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold">Group #{index + 1}</h2>
                  <Chip
                    label={`${(group.similarity_score * 100).toFixed(0)}% Similarity`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={group.detection_method || 'AI Match'}
                    variant="outlined"
                    size="small"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<X />}
                    onClick={() => handleRejectAll(group.id)}
                  >
                    Reject All
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Check />}
                    onClick={() => handleKeepSelected(group.id)}
                  >
                    Keep Selected Choice
                  </Button>
                </div>
              </div>

              <Grid container spacing={3}>
                {group.photos.map(photo => {
                  const isSelected = selectedPhotos[group.id] === photo.id;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={photo.id}>
                      <Card
                        onClick={() => handleSelectPhoto(group.id, photo.id)}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                          opacity: isSelected ? 1 : 0.75,
                          boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                        }}
                      >
                        <CardMedia
                          component="img"
                          alt="Duplicate candidate"
                          image={`http://localhost:8080/api/photos/${photo.id}/image`}
                          style={{ height: 220, objectFit: 'cover' }}
                        />
                        <div className="p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-700">
                              Quality: {photo.quality_score ? photo.quality_score.toFixed(1) : 'N/A'}
                            </span>
                            {photo.is_best_in_group && (
                              <Chip label="AI Pick" size="small" color="primary" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {photo.width && photo.height ? `${photo.width} × ${photo.height}` : 'Dimensions N/A'}
                            {photo.file_size ? ` • ${(photo.file_size / (1024 * 1024)).toFixed(1)} MB` : ''}
                          </p>
                        </div>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}