import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Switch, 
  Slider, 
  Button, 
  Grid,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';
import { Settings as SettingsIcon, Shield, Zap, Database, Lock } from 'lucide-react';
import { api } from '../services/api';

export default function Settings() {
  // State for toggles
  const [settings, setSettings] = useState({
    autoProcess: true,
    showNotifications: true,
    darkMode: false,
    localOnly: false,
    reverseGeocoding: true,
    contentSafety: true,
    gpuAcceleration: true,
    parallelProcessing: true,
  });

  // State for sliders
  const [batchSize, setBatchSize] = useState(100);
  const [qualityThreshold, setQualityThreshold] = useState(70);

  // State for Backend Data
  const [storageStats, setStorageStats] = useState({ db: '0.0', cache: '0.0' });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchStorageStats = async () => {
    try {
      const response = await api.get('/settings/storage');
      setStorageStats({
        db: response.data.database_size_mb.toFixed(1),
        cache: response.data.cache_size_mb.toFixed(1)
      });
    } catch (error) {
      console.error("Failed to fetch storage stats", error);
    }
  };

  useEffect(() => {
    fetchStorageStats();
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Backend Actions ---
  const handleClearCache = async () => {
    setIsProcessing(true);
    try {
      await api.post('/settings/clear-cache');
      await fetchStorageStats();
      alert("Temporary cache cleared!");
    } catch (e) {
      alert("Failed to clear cache.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimizeDb = async () => {
    setIsProcessing(true);
    try {
      await api.post('/settings/optimize-db');
      await fetchStorageStats();
      alert("Database optimized successfully!");
    } catch (e) {
      alert("Failed to optimize database.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportDb = () => {
    // Triggers file download in browser/Electron
    window.location.href = 'http://localhost:8000/api/settings/export-db';
  };

  const handleResetData = async () => {
    const confirmReset = window.confirm("WARNING: This will permanently delete all processed data, face profiles, and duplicate logs. Your original photos will NOT be deleted from their original folders. Are you absolutely sure?");
    if (!confirmReset) return;

    setIsProcessing(true);
    try {
      await api.post('/settings/reset-data');
      await fetchStorageStats();
      alert("System has been securely reset.");
    } catch (e) {
      alert("Failed to reset system.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Shared styling
  const cardStyle = { borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', mb: 4 };
  const sectionHeaderStyle = { display: 'flex', alignItems: 'center', gap: '12px', mb: 3, fontWeight: 'bold' };
  const switchStyle = { '& .MuiSwitch-switchBase.Mui-checked': { color: '#0f172a' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0f172a' } };
  const sliderStyle = { color: '#0f172a', height: 8, '& .MuiSlider-thumb': { backgroundColor: '#fff', border: '2px solid currentColor' } };
  const actionBtnStyle = { py: 1.5, color: '#374151', borderColor: '#e5e7eb', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: '#f9fafb' } };

  return (
    <Box sx={{ p: 4, maxWidth: '900px', margin: '0 auto', pb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Settings</Typography>
        <Typography variant="body1" color="text.secondary">Configure app behavior and preferences</Typography>
      </Box>

      {/* General Settings */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Box sx={sectionHeaderStyle}>
            <SettingsIcon size={20} color="#374151" />
            <Typography variant="h6" fontWeight="bold">General Settings</Typography>
          </Box>

          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" fontWeight="600">Auto-process imported photos</Typography>
                <Typography variant="body2" color="text.secondary">Start AI analysis immediately after import</Typography>
              </Box>
              <Switch checked={settings.autoProcess} onChange={() => handleToggle('autoProcess')} sx={switchStyle} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" fontWeight="600">Show notifications</Typography>
                <Typography variant="body2" color="text.secondary">Get notified when processing completes</Typography>
              </Box>
              <Switch checked={settings.showNotifications} onChange={() => handleToggle('showNotifications')} sx={switchStyle} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" fontWeight="600">Dark mode</Typography>
                <Typography variant="body2" color="text.secondary">Use dark theme throughout the app</Typography>
              </Box>
              <Switch checked={settings.darkMode} onChange={() => handleToggle('darkMode')} sx={switchStyle} />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Box sx={sectionHeaderStyle}>
            <Shield size={20} color="#374151" />
            <Typography variant="h6" fontWeight="bold">Privacy & Security</Typography>
          </Box>

          <Stack spacing={3} mb={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" fontWeight="600">Process photos locally only</Typography>
                <Typography variant="body2" color="text.secondary">All AI processing happens on your device</Typography>
              </Box>
              <Switch checked={settings.localOnly} onChange={() => handleToggle('localOnly')} sx={switchStyle} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" fontWeight="600">Enable reverse geocoding</Typography>
                <Typography variant="body2" color="text.secondary">Convert GPS coordinates to location names (requires internet)</Typography>
              </Box>
              <Switch checked={settings.reverseGeocoding} onChange={() => handleToggle('reverseGeocoding')} sx={switchStyle} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" fontWeight="600">Content safety filter</Typography>
                <Typography variant="body2" color="text.secondary">Automatically detect and flag sensitive content</Typography>
              </Box>
              <Switch checked={settings.contentSafety} onChange={() => handleToggle('contentSafety')} sx={switchStyle} />
            </Box>
          </Stack>

          <Box sx={{ backgroundColor: '#f0fdf4', p: 2, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Lock size={18} color="#b45309" />
            <Typography variant="body2" color="#166534">
              <span style={{ fontWeight: 'bold' }}>Privacy Guaranteed:</span> All photos and data remain on your device. No cloud uploads, no tracking, no external services.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Box sx={sectionHeaderStyle}>
            <Zap size={20} color="#374151" />
            <Typography variant="h6" fontWeight="bold">Performance</Typography>
          </Box>

          <Stack spacing={4} mb={4}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body1" fontWeight="600">Batch processing size</Typography>
                <Typography variant="body2" color="text.secondary">{batchSize} photos</Typography>
              </Box>
              <Slider 
                value={batchSize} 
                onChange={(_, val) => setBatchSize(val as number)} 
                min={10} max={500} step={10} 
                sx={sliderStyle} 
              />
              <Typography variant="body2" color="text.secondary">Higher values use more memory but process faster</Typography>
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body1" fontWeight="600">Image quality threshold</Typography>
                <Typography variant="body2" color="text.secondary">{qualityThreshold}/100</Typography>
              </Box>
              <Slider 
                value={qualityThreshold} 
                onChange={(_, val) => setQualityThreshold(val as number)} 
                min={0} max={100} 
                sx={sliderStyle} 
              />
              <Typography variant="body2" color="text.secondary">Photos below this score will be flagged for review</Typography>
            </Box>
          </Stack>

          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" fontWeight="600">Use GPU acceleration</Typography>
                <Typography variant="body2" color="text.secondary">Faster processing with NVIDIA GPU (if available)</Typography>
              </Box>
              <Switch checked={settings.gpuAcceleration} onChange={() => handleToggle('gpuAcceleration')} sx={switchStyle} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" fontWeight="600">Enable parallel processing</Typography>
                <Typography variant="body2" color="text.secondary">Process multiple photos simultaneously</Typography>
              </Box>
              <Switch checked={settings.parallelProcessing} onChange={() => handleToggle('parallelProcessing')} sx={switchStyle} />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Storage & Data */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Box sx={sectionHeaderStyle}>
            <Database size={20} color="#374151" />
            <Typography variant="h6" fontWeight="bold">Storage & Data</Typography>
          </Box>

          <Grid container spacing={2} mb={4}>
            <Grid item xs={6}>
              <Box sx={{ backgroundColor: '#f9fafb', p: 3, borderRadius: '12px' }}>
                <Typography variant="body2" color="text.secondary" mb={1}>Database Size</Typography>
                <Typography variant="h5" fontWeight="bold">{storageStats.db} MB</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ backgroundColor: '#f9fafb', p: 3, borderRadius: '12px' }}>
                <Typography variant="body2" color="text.secondary" mb={1}>Cache Size</Typography>
                <Typography variant="h5" fontWeight="bold">{storageStats.cache} MB</Typography>
              </Box>
            </Grid>
          </Grid>

          <Stack spacing={2}>
            <Button variant="outlined" onClick={handleClearCache} disabled={isProcessing} sx={actionBtnStyle}>
              {isProcessing ? <CircularProgress size={24} /> : 'Clear Cache'}
            </Button>
            <Button variant="outlined" onClick={handleOptimizeDb} disabled={isProcessing} sx={actionBtnStyle}>
              {isProcessing ? <CircularProgress size={24} /> : 'Optimize Database'}
            </Button>
            <Button variant="outlined" onClick={handleExportDb} sx={actionBtnStyle}>
              Export Database
            </Button>
            <Button variant="contained" onClick={handleResetData} disabled={isProcessing} sx={{ py: 1.5, backgroundColor: '#c81e32', color: 'white', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: '#a51829' } }}>
              {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Reset All Data'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* About */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={3}>About</Typography>
          
          <Stack spacing={2} mb={3}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Version:</Typography>
              <Typography variant="body2" fontWeight="600">1.0.0 (Beta)</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">AI Models:</Typography>
              <Typography variant="body2" fontWeight="600">CLIP, InsightFace, PaddleOCR</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">License:</Typography>
              <Typography variant="body2" fontWeight="600">MIT</Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />
          
          <Button fullWidth sx={{ justifyContent: 'flex-start', color: '#0f172a', fontWeight: 600, textTransform: 'none', p: 0, '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}>
            Check for Updates
          </Button>
        </CardContent>
      </Card>

    </Box>
  );
}