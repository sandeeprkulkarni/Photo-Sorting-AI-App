import React, { useState } from 'react';
import { Button, TextField, Grid, Card, CardMedia } from '@mui/material';
import { Upload, UserPlus } from 'lucide-react';
import { api } from '../services/api';

export default function FaceTrainer() {
  const [personName, setPersonName] = useState('');
  const [trainingPhotos, setTrainingPhotos] = useState<string[]>([]);

  const handleSelectPhotos = async () => {
    const photos = await (window as any).electronAPI.selectPhotos();
    setTrainingPhotos(photos);
  };

  const handleCreateAndTrain = async () => {
    if (!personName || trainingPhotos.length < 3) {
      alert('Please provide a name and at least 3 photos');
      return;
    }

    try {
      // Create person
      const createResponse = await api.post('/people/', {
        name: personName
      });

      const personId = createResponse.data.person_id;

      // Train with photos
      await api.post('/people/train', {
        person_id: personId,
        photo_paths: trainingPhotos
      });

      alert(`Successfully trained ${personName}!`);
      setPersonName('');
      setTrainingPhotos([]);
    } catch (error) {
      alert('Training failed: ' + error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Train New Person</h2>

      <div className="mb-4">
        <TextField
          label="Person Name"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          fullWidth
        />
      </div>

      <Button
        variant="outlined"
        startIcon={<Upload />}
        onClick={handleSelectPhotos}
        className="mb-4"
      >
        Select Training Photos ({trainingPhotos.length})
      </Button>

      {trainingPhotos.length > 0 && (
        <Grid container spacing={2} className="mb-4">
          {trainingPhotos.map((path, index) => (
            <Grid item xs={4} key={index}>
              <Card>
                <CardMedia
                  component="img"
                  image={`file://${path}`}
                  alt={`Training photo ${index + 1}`}
                  style={{ height: 150, objectFit: 'cover' }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Button
        variant="contained"
        startIcon={<UserPlus />}
        onClick={handleCreateAndTrain}
        disabled={!personName || trainingPhotos.length < 3}
      >
        Create & Train
      </Button>
    </div>
  );
}