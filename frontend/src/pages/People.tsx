import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Avatar, 
  Chip, 
  Stack, 
  Dialog, 
  DialogContent,
  DialogTitle,
  IconButton
} from '@mui/material';
import { UserPlus, Users, X } from 'lucide-react';
import { api } from '../services/api';
import FaceTrainer from '../components/FaceTrainer';

interface Person {
  id: number;
  name: string;
  photo_count: number;
  is_trained: boolean;
}

export default function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const fetchPeople = async () => {
    try {
      const response = await api.get('/people/');
      setPeople(response.data.people || []);
    } catch (error) {
      console.error('Failed to fetch people:', error);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleTrained = () => {
    setIsTrainerOpen(false);
    fetchPeople();
  };

  // --- Derived Statistics ---
  const trainedCount = people.filter(p => p.is_trained).length;
  const recognizedPhotos = people.reduce((acc, p) => acc + p.photo_count, 0);
  const unknownFaces = 0; // Placeholder: Ideally fetched from a backend "Unknown" cluster route
  const totalFacesDetected = recognizedPhotos + unknownFaces;

  // Shared Card Styling
  const cardStyle = { 
    borderRadius: '16px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    border: '1px solid #f3f4f6',
    height: '100%'
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>People</Typography>
          <Typography variant="body1" color="text.secondary">Manage face recognition and organize by people</Typography>
        </Box>
        
        <Button 
          variant="contained" 
          size="large"
          startIcon={<UserPlus size={20} />}
          onClick={() => setIsTrainerOpen(true)}
          sx={{ backgroundColor: '#0f172a', textTransform: 'none', px: 3, py: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#1e293b' } }}
        >
          Train New Person
        </Button>
      </Box>

      {/* Main Content Area */}
      <Grid container spacing={3} mb={4}>
        
        {/* Left Column: Recognized People List */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Users size={20} color="#374151" />
                <Typography variant="subtitle1" fontWeight="bold">Recognized People</Typography>
              </Box>

              <Stack spacing={3}>
                {people.map((person) => (
                  <Box 
                    key={person.id} 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    onClick={() => setSelectedPerson(person)}
                    sx={{ cursor: 'pointer', p: 1, borderRadius: '8px', '&:hover': { backgroundColor: '#f9fafb' } }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 48, height: 48, backgroundColor: '#e5e7eb', color: '#4b5563', fontWeight: 'bold' }}>
                        {person.name.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">{person.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{person.photo_count} photos</Typography>
                      </Box>
                    </Box>
                    {person.is_trained && (
                      <Chip label="Trained" size="small" sx={{ backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 600 }} />
                    )}
                  </Box>
                ))}

                {/* Unknown Faces Placeholder */}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ cursor: 'pointer', p: 1, borderRadius: '8px', '&:hover': { backgroundColor: '#f9fafb' } }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 48, height: 48, backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: 'bold' }}>UN</Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">Unknown Faces</Typography>
                      <Typography variant="body2" color="text.secondary">{unknownFaces} photos</Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>

            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Person Detail / Placeholder */}
        <Grid item xs={12} md={8}>
          <Card sx={{ ...cardStyle, display: 'flex', flexDirection: 'column' }} variant="outlined">
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={3}>
                {selectedPerson ? `${selectedPerson.name}'s Photos` : 'Select a person'}
              </Typography>
              
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} py={8}>
                <Users size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
                <Typography variant="body1" color="text.secondary">
                  {selectedPerson ? `Gallery for ${selectedPerson.name} will appear here.` : 'Select a person to view their photos'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Bottom Row: Stats Summary */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={3}>Face Recognition Stats</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ backgroundColor: '#eff6ff', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#1e3a8a" mb={0.5}>{trainedCount}</Typography>
                <Typography variant="body2" color="#60a5fa" fontWeight="500">Trained People</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#14532d" mb={0.5}>{totalFacesDetected}</Typography>
                <Typography variant="body2" color="#4ade80" fontWeight="500">Faces Detected</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ backgroundColor: '#faf5ff', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#581c87" mb={0.5}>{recognizedPhotos}</Typography>
                <Typography variant="body2" color="#c084fc" fontWeight="500">Recognized</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ backgroundColor: '#fff7ed', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#9a3412" mb={0.5}>{unknownFaces}</Typography>
                <Typography variant="body2" color="#fb923c" fontWeight="500">Unknown</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Face Trainer Modal */}
      <Dialog 
        open={isTrainerOpen} 
        onClose={() => setIsTrainerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Add New Person</Typography>
          <IconButton onClick={() => setIsTrainerOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* We reuse your existing FaceTrainer component here safely inside the modal! */}
          <FaceTrainer onTrained={handleTrained} />
        </DialogContent>
      </Dialog>

    </Box>
  );
}