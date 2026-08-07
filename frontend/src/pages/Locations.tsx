import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { MapPin, Globe, Satellite, Map as MapIcon, Database } from 'lucide-react';
import { api } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

export default function Locations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations/');
      setLocations(response.data.locations);
    } catch (error) {
      console.error("Failed to fetch locations", error);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Poll for background task progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/progress/task/${taskId}`);
          if (response.data.state === 'SUCCESS') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            fetchLocations(); // Refresh data when done
          } else if (response.data.state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            alert('Location processing failed.');
          }
        } catch (error) {
          console.error(error);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [taskId]);

  const handleProcessLocations = async () => {
    setProcessing(true);
    try {
      // Dispatch to Celery and get task_id
      const response = await api.post('/locations/process');
      setTaskId(response.data.task_id);
    } catch (error) {
      alert("Error starting location processing. Check console.");
      setProcessing(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-gray-600">Organize photos by GPS metadata.</p>
        </div>
        <Button 
          variant="contained" 
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <MapPin />}
          onClick={handleProcessLocations}
          disabled={processing}
        >
          {processing ? 'Geocoding in Background...' : 'Process Missing Locations'}
        </Button>
      </div>

      <PhasePulseScanner 
        isScanning={processing} 
        title="Geospatial Processing Engine"
        subtitle={taskId ? "Processing in background via Celery..." : "Reverse geocoding EXIF metadata via Nominatim API"}
        mainIcon={MapPin}
        phases={[
          { id: 1, title: 'Phase 1: Metadata Extraction', description: 'Extracting GPS latitude and longitude from photo EXIF data...', icon: Satellite },
          { id: 2, title: 'Phase 2: API Connection', description: 'Establishing secure connection to global geocoding API...', icon: Globe },
          { id: 3, title: 'Phase 3: Reverse Geocoding', description: 'Translating raw coordinates into human-readable city and country names...', icon: MapIcon },
          { id: 4, title: 'Phase 4: Database Indexing', description: 'Grouping photos by region and saving metadata to local database...', icon: Database }
        ]}
      />

      <Grid container spacing={3}>
        {locations.map((loc, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className="shadow-sm border">
              <CardContent>
                <Typography variant="h6" className="font-bold">{loc.name}</Typography>
                <Typography color="textSecondary">{loc.count} photos</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}