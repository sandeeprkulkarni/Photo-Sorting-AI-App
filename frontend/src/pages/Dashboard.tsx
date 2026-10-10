import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CircularProgress, Grid, Box, Typography, Stack, LinearProgress } from '@mui/material';
import { 
  Image as ImageIcon, 
  CheckCircle2, 
  Copy, 
  XCircle, 
  Users, 
  MapPin, 
  Calendar,
  Upload,
  Eye,
  ScanFace,
  Cpu // <-- Added the Cpu icon for the new button
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // NEW: State to track when the AI processing is starting
  const [starting, setStarting] = useState(false);
  
  const [stats, setStats] = useState({
    totalPhotos: 0,
    processed: 0,
    duplicates: 0,
    rejected: 0,
    people: 0,
    locations: 0,
    occasions: 0,
    useful: 0,
    spam: 0,
    greetings: 0
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/photos/stats/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // NEW: Function to trigger the background AI workers
  const handleProcessPending = async () => {
    setStarting(true);
    try {
      const response = await api.post('/photos/process-pending');
      if (response.data.task_id) {
        // Save the task ID so your progress scanner can track it!
        localStorage.setItem('importTaskId', response.data.task_id);
        alert(`Successfully started AI processing for ${response.data.count} photos! You can watch the progress on the Import tab.`);
      } else {
        alert('All photos are already processed!');
      }
    } catch (error) {
      console.error('Failed to start processing:', error);
      alert('Error starting background processing.');
    } finally {
      setStarting(false);
    }
  };

  const CustomProgressBar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="500">{label}</Typography>
          <Typography variant="body2" color="text.secondary">{count} photos</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: '#e5e7eb',
            '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 5 }
          }} 
        />
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  const processedPercentage = stats.totalPhotos > 0 
    ? Math.round((stats.processed / stats.totalPhotos) * 100) 
    : 0;

  const cardStyles = { 
    borderRadius: '16px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    border: '1px solid #f3f4f6',
    height: '100%'
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Dashboard</Typography>
        <Typography variant="body1" color="text.secondary">Overview of your photo library</Typography>
      </Box>

      {/* Top Row: Core Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="body2" fontWeight="600">Total Photos</Typography>
                <ImageIcon size={20} color="#9ca3af" />
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={0.5}>{stats.totalPhotos.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">{stats.totalPhotos} imported</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="body2" fontWeight="600">Processed</Typography>
                <CheckCircle2 size={20} color="#22c55e" />
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={1}>{stats.processed.toLocaleString()}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={processedPercentage} 
                sx={{ height: 6, borderRadius: 3, mb: 1, backgroundColor: '#e5e7eb', '& .MuiLinearProgress-bar': { backgroundColor: '#111827' } }} 
              />
              <Typography variant="caption" color="text.secondary">{processedPercentage}% complete</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="body2" fontWeight="600">Duplicates Found</Typography>
                <Copy size={20} color="#f97316" />
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={0.5}>{stats.duplicates.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">Can be removed</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="body2" fontWeight="600">Rejected</Typography>
                <XCircle size={20} color="#ef4444" />
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={0.5}>{stats.rejected.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">WhatsApp forwards & spam</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Middle Row: AI Entities */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="body2" fontWeight="600">People Detected</Typography>
                <Users size={20} color="#3b82f6" />
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={0.5}>{stats.people.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">Across {Math.floor(stats.totalPhotos * 0.52)} photos</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="body2" fontWeight="600">Locations</Typography>
                <MapPin size={20} color="#a855f7" />
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={0.5}>{stats.locations.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">From GPS metadata</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="body2" fontWeight="600">Occasions</Typography>
                <Calendar size={20} color="#16a34a" />
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={0.5}>{stats.occasions.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">Auto-detected categories</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row: Charts & Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" mb={4}>Classification Results</Typography>
              <CustomProgressBar label="Useful" count={stats.useful} total={stats.totalPhotos} color="#2563eb" />
              <CustomProgressBar label="Spam" count={stats.spam} total={stats.totalPhotos} color="#60a5fa" />
              <CustomProgressBar label="Greetings" count={stats.greetings} total={stats.totalPhotos} color="#93c5fd" />
              <CustomProgressBar label="Duplicates" count={stats.duplicates} total={stats.totalPhotos} color="#3b82f6" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={cardStyles} variant="outlined">
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>Quick Actions</Typography>
              <Stack spacing={2}>
                
                {/* NEW: The Night Mode button added directly into your existing Stack layout */}
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={handleProcessPending}
                  disabled={starting}
                  sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, backgroundColor: '#0f172a', '&:hover': { backgroundColor: '#1e293b' } }}
                  startIcon={starting ? <CircularProgress size={18} color="inherit" /> : <Cpu size={18} />}
                >
                  {starting ? 'Starting AI Workers...' : 'Run Pending Tasks (Night Mode)'}
                </Button>

                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/import')}
                  sx={{ justifyContent: 'flex-start', color: '#374151', borderColor: '#e5e7eb', py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                  startIcon={<Upload size={18} />}
                >
                  Import More Photos
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/review')}
                  sx={{ justifyContent: 'flex-start', color: '#374151', borderColor: '#e5e7eb', py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                  startIcon={<Eye size={18} />}
                >
                  Review Classifications
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/duplicates')}
                  sx={{ justifyContent: 'flex-start', color: '#374151', borderColor: '#e5e7eb', py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                  startIcon={<Copy size={18} />}
                >
                  Review Duplicates
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/people')}
                  sx={{ justifyContent: 'flex-start', color: '#374151', borderColor: '#e5e7eb', py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                  startIcon={<ScanFace size={18} />}
                >
                  Train Face Recognition
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}