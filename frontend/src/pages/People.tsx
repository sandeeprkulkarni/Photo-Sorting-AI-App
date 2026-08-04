import React, { useState, useEffect } from 'react';
import { Button, Grid, Card, CardContent, Typography, Chip } from '@mui/material';
import { ScanFace } from 'lucide-react';
import { api } from '../services/api';
import FaceTrainer from '../components/FaceTrainer';

export default function People() {
  const [people, setPeople] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  const loadPeople = async () => {
    try {
      const response = await api.get('/people/');
      setPeople(response.data.people);
    } catch (error) {
      console.error('Failed to load people:', error);
    }
  };

  // Load the list of people when the page opens
  useEffect(() => {
    loadPeople();
  }, []);

  const handleScanAll = async () => {
    setScanning(true);
    try {
      // Trigger the backend to detect and recognize faces in all processed photos
      await api.post('/people/detect-and-recognize');
      alert('Scanning completed!');
      loadPeople();
    } catch (error) {
      console.error('Scanning failed:', error);
      alert('Scanning failed. Check the backend console.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">People & Face Recognition</h1>
          <p className="text-gray-600">Train the AI to recognize your friends and family.</p>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ScanFace />}
          onClick={handleScanAll}
          disabled={scanning}
        >
          {scanning ? 'Scanning Library...' : 'Scan All Photos for Faces'}
        </Button>
      </div>

      <Grid container spacing={4}>
        {/* Left Column: Face Trainer Component */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card className="shadow-sm border">
            <FaceTrainer />
          </Card>
        </Grid>

        {/* Right Column: List of Trained People */}
        <Grid size={{ xs: 12, md: 7 }}>
          <h2 className="text-2xl font-bold mb-4">Recognized People</h2>
          {people.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border">
              <p className="text-gray-500">No people trained yet. Use the trainer to add someone!</p>
            </div>
          ) : (
            <Grid container spacing={2}>
              {people.map((person) => (
                <Grid size={{ xs: 12, sm: 6 }} key={person.id}>
                  <Card className="border shadow-sm">
                    <CardContent>
                      <Typography variant="h6" className="font-bold">
                        {person.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Photos found: {person.photo_count}
                      </Typography>
                      <Chip 
                        label={person.is_trained ? "Trained" : "Needs Training"} 
                        color={person.is_trained ? "success" : "warning"}
                        size="small"
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </div>
  );
}