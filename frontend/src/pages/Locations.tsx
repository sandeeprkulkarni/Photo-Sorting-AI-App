import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress,
  Box,
  Stack,
  Chip
} from '@mui/material';
import { MapPin, Globe, Satellite, Map as MapIcon, Database, Navigation } from 'lucide-react';
import { api } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

interface LocationData {
  name: string | null;
  count: number;
}

export default function Locations() {
  // --- Background Task State ---
  const savedTaskId = localStorage.getItem('locationsTaskId');
  const [processing, setProcessing] = useState(!!savedTaskId);
  const [taskId, setTaskId] = useState<string | null>(savedTaskId);

  // --- Location Data State ---
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations/');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error("Failed to fetch locations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
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
            localStorage.removeItem('locationsTaskId');
            fetchLocations();
          } else if (response.data.state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('locationsTaskId');
            alert('Location processing failed.');
          }
        } catch (error: any) {
          if (error.response?.status === 404 || error.response?.status === 500) {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('locationsTaskId');
          }
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [taskId]);

  const handleProcessLocations = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/locations/process');
      setTaskId(response.data.task_id);
      localStorage.setItem('locationsTaskId', response.data.task_id);
    } catch (error) {
      alert("Error starting location processing. Check console.");
      setProcessing(false);
    }
  };

  // --- Derived Statistics ---
  const knownLocations = locations.filter(loc => loc.name && loc.name.trim() !== '');
  const unknownLocations = locations.filter(loc => !loc.name || loc.name.trim() === '');
  
  const locationsFound = knownLocations.length;
  const photosWithGps = knownLocations.reduce((acc, loc) => acc + loc.count, 0);
  const photosUnknown = unknownLocations.reduce((acc, loc) => acc + loc.count, 0); // Fallback for UI if none exist yet

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
          <Typography variant="h4" fontWeight="bold" gutterBottom>Locations</Typography>
          <Typography variant="body1" color="text.secondary">Browse photos organized by location</Typography>
        </Box>
        <Button 
          variant="contained" 
          size="large"
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <MapPin size={20} />}
          onClick={handleProcessLocations}
          disabled={processing}
          sx={{ backgroundColor: '#0f172a', textTransform: 'none', px: 3, py: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#1e293b' } }}
        >
          {processing ? 'Geocoding...' : 'Scan Missing Locations'}
        </Button>
      </Box>

      {/* Scanner Animation (Only visible when processing) */}
      {processing && (
        <Box mb={4}>
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
        </Box>
      )}

      {/* Main Content Area */}
      <Grid container spacing={3} mb={4}>
        
        {/* Left Column: Location List */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <MapPin size={20} color="#374151" />
                <Typography variant="subtitle1" fontWeight="bold">Locations</Typography>
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={30} /></Box>
              ) : (
                <Stack spacing={2}>
                  {knownLocations.map((loc, idx) => (
                    <Box 
                      key={idx} 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center"
                      onClick={() => setSelectedLocation(loc)}
                      sx={{ cursor: 'pointer', p: 1.5, borderRadius: '8px', transition: 'all 0.2s', '&:hover': { backgroundColor: '#f9fafb' } }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Box sx={{ mt: 0.5 }}>
                          <Navigation size={18} color="#6b7280" />
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">{loc.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{loc.count} photos</Typography>
                        </Box>
                      </Box>
                      <Chip label="GPS" size="small" sx={{ backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 600, fontSize: '0.7rem' }} />
                    </Box>
                  ))}

                  {/* Unknown Location Entry */}
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    onClick={() => setSelectedLocation({ name: 'Unknown Location', count: photosUnknown })}
                    sx={{ cursor: 'pointer', p: 1.5, borderRadius: '8px', transition: 'all 0.2s', '&:hover': { backgroundColor: '#f9fafb' } }}
                  >
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Box sx={{ mt: 0.5 }}>
                        <MapPin size={18} color="#9ca3af" />
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">Unknown Location</Typography>
                        <Typography variant="body2" color="text.secondary">{photosUnknown} photos</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Location Detail / Placeholder */}
        <Grid item xs={12} md={8}>
          <Card sx={{ ...cardStyle, display: 'flex', flexDirection: 'column' }} variant="outlined">
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={3}>
                {selectedLocation ? selectedLocation.name : 'Select a location'}
              </Typography>
              
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} py={8}>
                <MapPin size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
                <Typography variant="body1" color="text.secondary">
                  {selectedLocation ? `Gallery for ${selectedLocation.name} will appear here.` : 'Select a location to view photos'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row: Stats Summary */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={3}>Location Detection Stats</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ backgroundColor: '#eff6ff', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#1e3a8a" mb={0.5}>{locationsFound}</Typography>
                <Typography variant="body2" color="#60a5fa" fontWeight="500">Locations Found</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#14532d" mb={0.5}>{photosWithGps}</Typography>
                <Typography variant="body2" color="#4ade80" fontWeight="500">With GPS Data</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ backgroundColor: '#fff7ed', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="#9a3412" mb={0.5}>{photosUnknown}</Typography>
                <Typography variant="body2" color="#fb923c" fontWeight="500">Unknown</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

    </Box>
  );
}