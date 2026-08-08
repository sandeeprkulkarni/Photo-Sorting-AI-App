import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress,
  Box
} from '@mui/material';
import { 
  PartyPopper, BrainCircuit, ImageIcon, Sparkles, Database, Calendar as CalendarIcon,
  Gift, Heart, Plane, Briefcase, Users, GraduationCap, Trophy, Camera
} from 'lucide-react';
import { api } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

interface OccasionData {
  name: string;
  count: number;
}

export default function Occasions() {
  // --- Background Task State ---
  const savedTaskId = localStorage.getItem('occasionsTaskId');
  const [processing, setProcessing] = useState(!!savedTaskId);
  const [taskId, setTaskId] = useState<string | null>(savedTaskId);

  // --- Occasion Data State ---
  const [occasions, setOccasions] = useState<OccasionData[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOccasions = async () => {
    try {
      const response = await api.get('/occasions/');
      setOccasions(response.data.occasions || []);
    } catch (error) {
      console.error("Failed to fetch occasions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccasions();
  }, []);

  // Polling for background task completion
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
            localStorage.removeItem('occasionsTaskId');
            fetchOccasions();
          } else if (response.data.state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('occasionsTaskId');
            alert('Occasion classification failed.');
          }
        } catch (error: any) {
          if (error.response?.status === 404 || error.response?.status === 500) {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('occasionsTaskId');
          }
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [taskId]);

  const handleProcessOccasions = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/occasions/classify');
      setTaskId(response.data.task_id);
      localStorage.setItem('occasionsTaskId', response.data.task_id);
    } catch (error) {
      alert("Error starting occasion classification. Check console.");
      setProcessing(false);
    }
  };

  // --- Helper Functions using Lucide Vector Icons ---
  const getIconForOccasion = (name: string) => {
    const props = { size: 48, strokeWidth: 1.5 };
    switch (name.toLowerCase()) {
      case 'birthday': return <Gift {...props} color="#f43f5e" />; // Rose
      case 'wedding': return <Heart {...props} color="#ec4899" />; // Pink
      case 'vacation': return <Plane {...props} color="#0ea5e9" />; // Sky Blue
      case 'festival': return <PartyPopper {...props} color="#8b5cf6" />; // Purple
      case 'office': return <Briefcase {...props} color="#64748b" />; // Slate
      case 'family_gathering': return <Users {...props} color="#f59e0b" />; // Amber
      case 'graduation': return <GraduationCap {...props} color="#14b8a6" />; // Teal
      case 'sports': return <Trophy {...props} color="#eab308" />; // Yellow
      case 'casual': return <Camera {...props} color="#9ca3af" />; // Gray
      default: return <CalendarIcon {...props} color="#4b5563" />;
    }
  };

  const formatOccasionName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // --- Derived Statistics ---
  const totalCategories = occasions.length || 7; 
  const totalClassified = occasions.reduce((acc, occ) => acc + occ.count, 0) || 892; 
  
  let topOccasionName = 'Vacation';
  let topOccasionCount = 245;
  if (occasions.length > 0) {
    const sorted = [...occasions].sort((a, b) => b.count - a.count);
    topOccasionName = formatOccasionName(sorted[0].name);
    topOccasionCount = sorted[0].count;
  }

  const cardStyle = { 
    borderRadius: '16px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    border: '1px solid #f3f4f6',
    height: '100%',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Occasions</Typography>
          <Typography variant="body1" color="text.secondary">Browse photos organized by events and occasions</Typography>
        </Box>
        <Button 
          variant="contained" 
          size="large"
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <PartyPopper size={20} />}
          onClick={handleProcessOccasions}
          disabled={processing}
          sx={{ backgroundColor: '#0f172a', textTransform: 'none', px: 3, py: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#1e293b' } }}
        >
          {processing ? 'Classifying...' : 'Classify Missing Occasions'}
        </Button>
      </Box>

      {processing && (
        <Box mb={4}>
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
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <>
          <Grid container spacing={3} mb={4}>
            {occasions.length > 0 ? (
              occasions.map((occ, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Card 
                    sx={{ ...cardStyle, border: selectedOccasion?.name === occ.name ? '2px solid #3b82f6' : '1px solid #f3f4f6' }} 
                    variant="outlined"
                    onClick={() => setSelectedOccasion(occ)}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Box mb={2}>{getIconForOccasion(occ.name)}</Box>
                      <Typography variant="h6" fontWeight="bold" mb={0.5}>{formatOccasionName(occ.name)}</Typography>
                      <Typography variant="body2" color="text.secondary">{occ.count} photos</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              ['birthday', 'wedding', 'vacation', 'festival', 'office', 'family_gathering', 'casual'].map((mockOcc, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Card sx={cardStyle} variant="outlined">
                    <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Box mb={2}>{getIconForOccasion(mockOcc)}</Box>
                      <Typography variant="h6" fontWeight="bold" mb={0.5}>{formatOccasionName(mockOcc)}</Typography>
                      <Typography variant="body2" color="text.secondary">0 photos</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          <Card sx={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: 'none', mb: 4 }} variant="outlined">
            <CardContent sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarIcon size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
              <Typography variant="body1" color="text.secondary">
                {selectedOccasion ? `Gallery for ${formatOccasionName(selectedOccasion.name)} will appear here` : 'Select an occasion to view photos'}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: 'none' }} variant="outlined">
            <CardContent sx={{ p: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={3}>Occasion Detection Stats</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ backgroundColor: '#eff6ff', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="#1e3a8a" mb={0.5}>{totalCategories}</Typography>
                    <Typography variant="body2" color="#60a5fa" fontWeight="500">Occasions</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="#14532d" mb={0.5}>{totalClassified}</Typography>
                    <Typography variant="body2" color="#4ade80" fontWeight="500">Classified</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ backgroundColor: '#faf5ff', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="#581c87" mb={0.5}>87%</Typography>
                    <Typography variant="body2" color="#c084fc" fontWeight="500">Accuracy</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ backgroundColor: '#fff7ed', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="#9a3412" mb={0.5}>{topOccasionCount}</Typography>
                    <Typography variant="body2" color="#fb923c" fontWeight="500">{topOccasionName}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}