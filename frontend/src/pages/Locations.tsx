import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { MapPin } from 'lucide-react';
import { api } from '../services/api';

export default function Locations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

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

  const handleProcessLocations = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/locations/process');
      alert(`Successfully processed ${response.data.processed} photos!`);
      fetchLocations();
    } catch (error) {
      alert("Error processing locations. Check console.");
    } finally {
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
          {processing ? 'Geocoding...' : 'Process Missing Locations'}
        </Button>
      </div>

      <Grid container spacing={3}>
        {locations.map((loc, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
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