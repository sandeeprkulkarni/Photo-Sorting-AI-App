import React, { useState, useEffect } from 'react';
import { Button, Grid, Card, CardContent, Typography, Chip } from '@mui/material';
import { ScanFace, Cpu, Dna, Database } from 'lucide-react';
import { api } from '../services/api';
import FaceTrainer from '../components/FaceTrainer';
import PhasePulseScanner from '../components/PhasePulseScanner';

export default function People() {
  const [people, setPeople] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  const fetchPeople = async () => {
    try {
      const response = await api.get('/people/');
      setPeople(response.data.people);
    } catch (error) {
      console.error('Failed to fetch people:', error);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleScanAllPhotos = async () => {
    setScanning(true);
    try {
      const response = await api.post('/people/detect-and-recognize');
      alert(
        `Scan complete!\nDetected Faces: ${response.data.detected_faces}\nRecognized Matches: ${response.data.recognized_faces}`
      );
      fetchPeople();
    } catch (error) {
      console.error('Scanning error:', error);
      alert('Scanning failed. Check console for details.');
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
          onClick={handleScanAllPhotos}
          disabled={scanning}
        >
          {scanning ? 'Scanning Library...' : 'Scan All Photos for Faces'}
        </Button>
      </div>

      <PhasePulseScanner 
        isScanning={scanning} 
        title="Neural Face Recognition Engine"
        subtitle="Batch processing library photos locally on CPU"
        mainIcon={ScanFace}
        phases={[
          { id: 1, title: 'Phase 1: Engine Initialization', description: 'Waking up InsightFace neural networks & loading ONNX models...', icon: Cpu },
          { id: 2, title: 'Phase 2: Deep Facial Extraction', description: 'Scanning photos for facial boundaries, landmarks, and pose angles...', icon: ScanFace },
          { id: 3, title: 'Phase 3: Biometric Vector Matching', description: 'Calculating 512-D embedding vectors and evaluating cosine similarity...', icon: Dna },
          { id: 4, title: 'Phase 4: Database Indexing', description: 'Mapping recognized face identities and linking database records...', icon: Database }
        ]}
      />

      <Grid container spacing={4}>
        {/* Left Column: Trainer Form */}
        <Grid item xs={12} md={5}>
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <FaceTrainer onTrained={fetchPeople} />
          </div>
        </Grid>

        {/* Right Column: Trained Profiles */}
        <Grid item xs={12} md={7}>
          <h2 className="text-2xl font-bold mb-4">Recognized People</h2>
          <Grid container spacing={2}>
            {people.map((person) => (
              <Grid item xs={12} sm={6} key={person.id}>
                <Card className="shadow-sm border">
                  <CardContent>
                    <Typography variant="h6" className="font-bold">
                      {person.name}
                    </Typography>
                    <Typography color="textSecondary" variant="body2" className="mb-2">
                      Photos found: {person.photo_count}
                    </Typography>
                    <Chip
                      label={person.is_trained ? 'Trained' : 'Needs Training'}
                      color={person.is_trained ? 'success' : 'warning'}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}