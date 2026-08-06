import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { PartyPopper } from 'lucide-react';
import { api } from '../services/api';

export default function Occasions() {
  const [occasions, setOccasions] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  const fetchOccasions = async () => {
    try {
      const response = await api.get('/occasions/');
      setOccasions(response.data.occasions);
    } catch (error) {
      console.error("Failed to fetch occasions", error);
    }
  };

  useEffect(() => {
    fetchOccasions();
  }, []);

  const handleProcessOccasions = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/occasions/classify');
      alert(`Successfully classified ${response.data.processed} photos!`);
      fetchOccasions();
    } catch (error) {
      alert("Error classifying occasions. Check console.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Occasions</h1>
          <p className="text-gray-600">AI-detected events and gatherings.</p>
        </div>
        <Button 
          variant="contained" 
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <PartyPopper />}
          onClick={handleProcessOccasions}
          disabled={processing}
        >
          {processing ? 'Classifying with CLIP...' : 'Classify Missing Occasions'}
        </Button>
      </div>

      <Grid container spacing={3}>
        {occasions.map((occ, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card className="shadow-sm border">
              <CardContent>
                <Typography variant="h6" className="font-bold capitalize">{occ.name.replace('_', ' ')}</Typography>
                <Typography color="textSecondary">{occ.count} photos</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}