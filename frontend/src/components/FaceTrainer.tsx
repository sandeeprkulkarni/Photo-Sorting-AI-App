import React, { useState, useEffect } from 'react';
import { Button, TextField, Grid, Card, CardMedia, LinearProgress, Box, Typography } from '@mui/material';
import { Upload, UserPlus, Cpu, ScanFace } from 'lucide-react';
import { api } from '../services/api';

interface FaceTrainerProps {
  onTrained?: () => void;
}

const STATUS_MESSAGES = [
  "Waking up InsightFace Neural Networks...",
  "Scanning photos for facial boundaries...",
  "Aligning and cropping faces...",
  "Extracting 512-dimensional biometric vectors...",
  "Finalizing profile mapping..."
];

export default function FaceTrainer({ onTrained }: FaceTrainerProps) {
  const [personName, setPersonName] = useState('');
  const [trainingPhotos, setTrainingPhotos] = useState<string[]>([]);
  
  // New State for the Neural Scanner
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  // Simulated Progress & Telemetry Effect
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let textTimer: NodeJS.Timeout;

    if (loading) {
      // 1. Progress Bar Logic: Asymptotically approach 95%
      progressTimer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 95) return 95;
          // Slowly creep up, slowing down as it gets higher
          const increment = (95 - oldProgress) * 0.05; 
          return oldProgress + increment;
        });
      }, 500);

      // 2. Status Text Logic: Change text every 8 seconds
      textTimer = setInterval(() => {
        setStatusIndex((oldIndex) => {
          // Stop at the last message ("Extracting vectors...") until finished
          if (oldIndex >= STATUS_MESSAGES.length - 1) return oldIndex;
          return oldIndex + 1;
        });
      }, 8000);
    }

    return () => {
      clearInterval(progressTimer);
      clearInterval(textTimer);
    };
  }, [loading]);

  const handleSelectPhotos = async () => {
    try {
      const photos = await (window as any).electronAPI.selectPhotos();
      if (photos && photos.length > 0) {
        setTrainingPhotos(photos);
      }
    } catch (error) {
      console.error('Failed to select photos:', error);
    }
  };

  const handleCreateAndTrain = async () => {
    if (!personName || trainingPhotos.length < 3) {
      alert('Please provide a name and at least 3 photos');
      return;
    }

    // Reset and start scanner
    setLoading(true);
    setProgress(0);
    setStatusIndex(0);

    try {
      const createResponse = await api.post('/people/', {
        name: personName
      });
      const personId = createResponse.data.person_id;

      await api.post('/people/train', {
        person_id: personId,
        photo_paths: trainingPhotos
      });

      // Snap to 100% on success
      setProgress(100);
      
      // Wait a tiny bit so the user sees 100% before it clears
      setTimeout(() => {
        alert(`Successfully trained ${personName}!`);
        setPersonName('');
        setTrainingPhotos([]);
        setLoading(false);
        if (onTrained) onTrained();
      }, 500);

    } catch (error: any) {
      console.error('Training error:', error);
      alert('Training failed: ' + (error.response?.data?.error || error.message));
      setLoading(false);
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
          disabled={loading}
        />
      </div>

      <Button
        variant="outlined"
        startIcon={<Upload />}
        onClick={handleSelectPhotos}
        className="mb-4"
        disabled={loading}
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
                  style={{ height: 150, objectFit: 'cover', opacity: loading ? 0.5 : 1 }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dynamic Neural Scanner UI */}
      {loading ? (
        <Box className="mt-4 p-4 border rounded-lg bg-gray-50 border-blue-200">
          <div className="flex items-center gap-3 mb-3 text-blue-600">
            <Cpu className="animate-pulse" size={24} />
            <Typography variant="subtitle1" className="font-semibold animate-pulse">
              {STATUS_MESSAGES[statusIndex]}
            </Typography>
          </div>
          
          <Box className="flex items-center gap-3">
            <Box className="w-full">
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" className="min-w-[40px]">
              {Math.round(progress)}%
            </Typography>
          </Box>
        </Box>
      ) : (
        <Button
          variant="contained"
          startIcon={<UserPlus />}
          onClick={handleCreateAndTrain}
          disabled={!personName || trainingPhotos.length < 3}
          fullWidth
          className="mt-4"
        >
          Create & Train
        </Button>
      )}
    </div>
  );
}