import React, { useState, useEffect } from 'react';
import { 
  Button, Card, CardContent, Typography, Box, Grid, Avatar, Chip, Stack, Dialog, 
  DialogContent, DialogTitle, IconButton, CircularProgress, FormControl, InputLabel, Select, MenuItem, CardMedia
} from '@mui/material';
import { UserPlus, Users, X, ScanFace, Database, BrainCircuit, Search, ImageIcon, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import FaceTrainer from '../components/FaceTrainer';
import PhasePulseScanner from '../components/PhasePulseScanner';

interface Person {
  id: number;
  name: string;
  photo_count: number;
  training_photo_count: number;
  training_photo_paths: string[];
  is_trained: boolean;
}

interface UnknownFace {
  face_id: number;
  photo_id: number;
  file_path: string;
}

export default function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [unknownFaces, setUnknownFaces] = useState<UnknownFace[]>([]);
  const [stats, setStats] = useState({ trained_people: 0, faces_detected: 0, recognized: 0, unknown: 0 });

  const savedTaskId = localStorage.getItem('facesTaskId');
  const [processing, setProcessing] = useState(!!savedTaskId);
  const [taskId, setTaskId] = useState<string | null>(savedTaskId);
  const [statusText, setStatusText] = useState('');

  const fetchPeopleAndStats = async () => {
    try {
      const [peopleRes, statsRes] = await Promise.all([
        api.get('/people/'),
        api.get('/people/stats/overview')
      ]);
      setPeople(peopleRes.data.people || []);
      setStats(statsRes.data);
      
      if (selectedPerson && selectedPerson.id !== -1) {
        const updatedSelected = peopleRes.data.people.find((p: Person) => p.id === selectedPerson.id);
        if (updatedSelected) setSelectedPerson(updatedSelected);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    fetchPeopleAndStats();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/progress/task/${taskId}`);
          const { state, status } = response.data;
          setStatusText(`Status: ${state} | ${status || 'Scanning faces...'}`);

          if (state === 'SUCCESS') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('facesTaskId');
            fetchPeopleAndStats();
            if (selectedPerson?.id === -1) handleSelectUnknown(); // Refresh unknown gallery
          } else if (state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('facesTaskId');
          }
        } catch (error: any) {
          if (error.response?.status === 404 || error.response?.status === 500) {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('facesTaskId');
          }
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [taskId]);

  // RESTORED: This function was missing!
  const handleTrained = () => {
    setIsTrainerOpen(false);
    fetchPeopleAndStats();
  };

  const handleSelectUnknown = async () => {
    setSelectedPerson({ id: -1, name: 'Unknown Faces', photo_count: stats.unknown, training_photo_count: 0, training_photo_paths: [], is_trained: false });
    try {
      const res = await api.get('/people/unknown/faces');
      setUnknownFaces(res.data.faces);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTagFace = async (faceId: number, personId: number) => {
    try {
      await api.post(`/people/faces/${faceId}/tag`, { person_id: personId });
      setUnknownFaces(prev => prev.filter(f => f.face_id !== faceId)); // Remove from local view
      fetchPeopleAndStats(); // Refresh dashboard numbers
    } catch (error) {
      alert("Failed to tag face");
    }
  };

  const handleScanLibrary = async () => {
    setProcessing(true);
    setStatusText('Dispatching face scanner to Celery workers...');
    try {
      const response = await api.post('/people/detect-and-recognize');
      setTaskId(response.data.task_id);
      localStorage.setItem('facesTaskId', response.data.task_id);
    } catch (error) {
      setProcessing(false);
    }
  };

  const cardStyle = { borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', height: '100%' };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>People</Typography>
          <Typography variant="body1" color="text.secondary">Manage face recognition and organize by people</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" size="large" startIcon={<UserPlus size={20} />}
            onClick={() => setIsTrainerOpen(true)} disabled={processing}
            sx={{ backgroundColor: '#0f172a', textTransform: 'none', px: 3, py: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#1e293b' } }}
          >
            Train New Person
          </Button>
          <Button 
            variant="contained" size="large" startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <ScanFace size={20} />}
            onClick={handleScanLibrary} disabled={processing || stats.trained_people === 0}
            sx={{ backgroundColor: '#10b981', textTransform: 'none', px: 3, py: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#059669' } }}
          >
            {processing ? 'Scanning...' : 'Scan Library'}
          </Button>
        </Box>
      </Box>

      {processing && (
        <Box mb={4}>
          <PhasePulseScanner 
            isScanning={processing} title="Biometric Recognition Engine" subtitle={statusText} mainIcon={ScanFace}
            phases={[
              { id: 1, title: 'Phase 1: Database Query', description: 'Fetching unknown faces...', icon: Database },
              { id: 2, title: 'Phase 2: Vector Math', description: 'Comparing 512-dimensional arrays...', icon: BrainCircuit },
              { id: 3, title: 'Phase 3: Cosine Matching', description: 'Assigning matches to family profiles...', icon: Users }
            ]}
          />
        </Box>
      )}

      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={cardStyle} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Users size={20} color="#374151" />
                <Typography variant="subtitle1" fontWeight="bold">Recognized People</Typography>
              </Box>

              <Stack spacing={3}>
                {people.map((person) => (
                  <Box 
                    key={person.id} display="flex" justifyContent="space-between" alignItems="center"
                    onClick={() => setSelectedPerson(person)}
                    sx={{ cursor: 'pointer', p: 1, borderRadius: '8px', backgroundColor: selectedPerson?.id === person.id ? '#eff6ff' : 'transparent', '&:hover': { backgroundColor: selectedPerson?.id === person.id ? '#eff6ff' : '#f9fafb' } }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 48, height: 48, backgroundColor: '#e5e7eb', color: '#4b5563', fontWeight: 'bold' }}>
                        {person.name.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">{person.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {person.photo_count} photos {person.training_photo_count > 0 && `• ${person.training_photo_count} training`}
                        </Typography>
                      </Box>
                    </Box>
                    {person.is_trained && (
                      <Chip label="Trained" size="small" sx={{ backgroundColor: selectedPerson?.id === person.id ? '#bfdbfe' : '#f3f4f6', color: '#374151', fontWeight: 600 }} />
                    )}
                  </Box>
                ))}

                <Box 
                  onClick={handleSelectUnknown}
                  display="flex" justifyContent="space-between" alignItems="center" 
                  sx={{ cursor: 'pointer', p: 1, borderRadius: '8px', backgroundColor: selectedPerson?.id === -1 ? '#fff7ed' : 'transparent', '&:hover': { backgroundColor: selectedPerson?.id === -1 ? '#fff7ed' : '#f9fafb' } }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 48, height: 48, backgroundColor: selectedPerson?.id === -1 ? '#fed7aa' : '#f3f4f6', color: selectedPerson?.id === -1 ? '#9a3412' : '#6b7280', fontWeight: 'bold' }}>UN</Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="bold" color={selectedPerson?.id === -1 ? '#9a3412' : 'inherit'}>Unknown Faces</Typography>
                      <Typography variant="body2" color={selectedPerson?.id === -1 ? '#c2410c' : 'text.secondary'}>{stats.unknown} photos</Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ ...cardStyle, display: 'flex', flexDirection: 'column' }} variant="outlined">
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={3}>
                {selectedPerson?.id === -1 ? 'Tag Unknown Faces' : selectedPerson ? `Photos used to train ${selectedPerson.name}` : 'Select a person'}
              </Typography>
              
              {selectedPerson?.id === -1 ? (
                 unknownFaces.length > 0 ? (
                  <Grid container spacing={2}>
                    {unknownFaces.map((face) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={face.face_id}>
                        <Card variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                          <CardMedia component="img" image={`file://${face.file_path}`} style={{ height: 180, objectFit: 'cover' }} />
                          <Box p={1.5} backgroundColor="#f9fafb">
                            <FormControl fullWidth size="small">
                              <InputLabel>Tag Person</InputLabel>
                              <Select value="" label="Tag Person" onChange={(e) => handleTagFace(face.face_id, Number(e.target.value))}>
                                {people.map(p => (
                                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                 ) : (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} py={8}>
                    <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '16px' }} />
                    <Typography variant="body1" color="text.secondary">All faces have been tagged!</Typography>
                  </Box>
                 )
              ) : selectedPerson ? (
                selectedPerson.training_photo_paths && selectedPerson.training_photo_paths.length > 0 ? (
                  <Grid container spacing={2}>
                    {selectedPerson.training_photo_paths.map((path, idx) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                        <Box sx={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                          <img src={`file://${path}`} alt={`Training reference for ${selectedPerson.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} py={8}>
                    <ImageIcon size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
                    <Typography variant="body1" color="text.secondary">No training photos available.</Typography>
                  </Box>
                )
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} py={8}>
                  <Users size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
                  <Typography variant="body1" color="text.secondary">Select a person to review their photos</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={3}>Face Recognition Stats</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ backgroundColor: '#eff6ff', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#1e3a8a" mb={0.5}>{stats.trained_people}</Typography>
                <Typography variant="body2" color="#60a5fa" fontWeight="500">Trained People</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#14532d" mb={0.5}>{stats.faces_detected}</Typography>
                <Typography variant="body2" color="#4ade80" fontWeight="500">Faces Detected</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ backgroundColor: '#faf5ff', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#581c87" mb={0.5}>{stats.recognized}</Typography>
                <Typography variant="body2" color="#c084fc" fontWeight="500">Recognized</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ backgroundColor: '#fff7ed', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#9a3412" mb={0.5}>{stats.unknown}</Typography>
                <Typography variant="body2" color="#fb923c" fontWeight="500">Unknown</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={isTrainerOpen} onClose={() => setIsTrainerOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography component="span" variant="h6" fontWeight="bold">Add New Person</Typography>
          <IconButton onClick={() => setIsTrainerOpen(false)} size="small"><X size={20} /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <FaceTrainer onTrained={handleTrained} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}