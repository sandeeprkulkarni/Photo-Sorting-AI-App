import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { PartyPopper, BrainCircuit, ImageIcon, Sparkles, Database } from 'lucide-react';
import { api } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

export default function Occasions() {
  const [occasions, setOccasions] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

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
            fetchOccasions(); // Refresh data when done
          } else if (response.data.state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            alert('Occasion classification failed.');
          }
        } catch (error) {
          console.error(error);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [taskId]);

  const handleProcessOccasions = async () => {
    setProcessing(true);
    try {
      // Dispatch to Celery and get task_id
      const response = await api.post('/occasions/classify');
      setTaskId(response.data.task_id);
    } catch (error) {
      alert("Error starting occasion classification. Check console.");
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
          {processing ? 'Classifying in Background...' : 'Classify Missing Occasions'}
        </Button>
      </div>

      <PhasePulseScanner 
        isScanning={processing} 
        title="CLIP Semantic Classifier"
        subtitle={taskId ? "Processing in background via Celery..." : "Evaluating photo context via zero-shot neural processing"}
        mainIcon={PartyPopper}
        phases={[
          { id: 1, title: 'Phase 1: Model Initialization', description: 'Loading CLIP ViT-B/32 neural network into system memory...', icon: BrainCircuit },
          { id: 2, title: 'Phase 2: Semantic Extraction', description: 'Evaluating photo pixels and generating high-dimensional embeddings...', icon: ImageIcon },
          { id: 3, title: 'Phase 3: Pattern Classification', description: 'Calculating cosine similarity against occasion text prompts...', icon: Sparkles },
          { id: 4, title: 'Phase 4: Database Indexing', description: 'Applying optimal category labels and updating database records...', icon: Database }
        ]}
      />

      <Grid container spacing={3}>
        {occasions.map((occ, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
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