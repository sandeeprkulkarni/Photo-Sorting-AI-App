import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Checkbox, 
  FormControlLabel, 
  Chip,
  CircularProgress
} from '@mui/material';
import { FolderOpen, Upload, ImageIcon, Cpu, Database, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

export default function Import() {
  const savedTaskId = localStorage.getItem('importTaskId');
  
  const [importing, setImporting] = useState(false);
  const [processing, setProcessing] = useState(!!savedTaskId);
  const [taskId, setTaskId] = useState<string | null>(savedTaskId);
  const [results, setResults] = useState<any>(null);

  // Checkbox states
  const [options, setOptions] = useState({
    includeSubfolders: true,
    skipDuplicates: true,
    extractGps: true,
    processImmediately: true
  });

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked,
    });
  };

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
            localStorage.removeItem('importTaskId');
            alert('AI Processing complete for imported photos!');
          } else if (response.data.state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('importTaskId');
            alert('Background AI processing failed.');
          }
        } catch (error: any) {
          if (error.response?.status === 404 || error.response?.status === 500) {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('importTaskId');
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [taskId]);

  const handleSelectFolder = async () => {
    try {
      const folderPath = await (window as any).electronAPI.selectFolder();
      if (folderPath) {
        setImporting(true);
        setResults(null);
        
        // 1. Grab the saved batch size from browser memory (default to 100 if none exists)
        const savedBatchSize = parseInt(localStorage.getItem('batchSize') || '100', 10);

        // 2. Send the selected options AND the batch size to the backend
        const response = await api.post('/photos/import', { 
          source_path: folderPath,
          include_subfolders: options.includeSubfolders,
          skip_duplicates: options.skipDuplicates,
          extract_gps: options.extractGps,
          process_immediately: options.processImmediately,
          batch_size: savedBatchSize // <--- The new line connecting your Settings to the Import!
        });
        
        setResults(response.data);
        setImporting(false);

        if (response.data.task_id) {
          setProcessing(true);
          setTaskId(response.data.task_id);
          localStorage.setItem('importTaskId', response.data.task_id);
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImporting(false);
    }
  };

  const cardStyle = { borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', mb: 3 };
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.heic', '.webp', '.raw', '.cr2', '.nef'];

  return (
    <Box sx={{ p: 4, maxWidth: '900px', margin: '0 auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Import Photos</Typography>
        <Typography variant="body1" color="text.secondary">Import photos from your computer for organization</Typography>
      </Box>

      {/* Upload Card */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={3}>Select Photos to Import</Typography>
          
          <Box sx={{ 
            border: '2px dashed #e5e7eb', 
            borderRadius: '12px', 
            p: 6, 
            textAlign: 'center',
            backgroundColor: '#fafafa',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: '#d1d5db', backgroundColor: '#f3f4f6' }
          }}>
            <FolderOpen size={48} color="#9ca3af" style={{ margin: '0 auto', marginBottom: '16px' }} />
            <Typography variant="h6" fontWeight="600" mb={1}>Choose a folder to import</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Select a folder containing your photos. We'll analyze and organize them automatically.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <Upload size={18} />}
              onClick={handleSelectFolder}
              disabled={importing || processing}
              sx={{ backgroundColor: '#0f172a', textTransform: 'none', px: 4, py: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#1e293b' } }}
            >
              {importing ? 'Copying Files...' : 'Select Folder'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Options Card */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={3}>Import Options</Typography>
          
          <Box display="flex" flexDirection="column" gap={2.5}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" fontWeight="600">Include subfolders</Typography>
                <Typography variant="body2" color="text.secondary">Import photos from all subdirectories</Typography>
              </Box>
              <Checkbox name="includeSubfolders" checked={options.includeSubfolders} onChange={handleOptionChange} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" fontWeight="600">Skip duplicates</Typography>
                <Typography variant="body2" color="text.secondary">Don't import photos that already exist</Typography>
              </Box>
              <Checkbox name="skipDuplicates" checked={options.skipDuplicates} onChange={handleOptionChange} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" fontWeight="600">Extract GPS data</Typography>
                <Typography variant="body2" color="text.secondary">Read location from photo metadata</Typography>
              </Box>
              <Checkbox name="extractGps" checked={options.extractGps} onChange={handleOptionChange} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" fontWeight="600">Process immediately</Typography>
                <Typography variant="body2" color="text.secondary">Start AI analysis after import</Typography>
              </Box>
              <Checkbox name="processImmediately" checked={options.processImmediately} onChange={handleOptionChange} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Formats Card */}
      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={3}>Supported Formats</Typography>
          <Box display="flex" gap={1.5} flexWrap="wrap" mb={3}>
            {supportedFormats.map(fmt => (
              <Chip 
                key={fmt} 
                label={fmt} 
                sx={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 500, borderRadius: '8px' }} 
              />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">
            All formats are supported. RAW files will be converted for preview.
          </Typography>
        </CardContent>
      </Card>

      {/* Results / Scanner Area */}
      {results && !processing && (
        <Box sx={{ mt: 4, p: 3, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Check size={20} color="#16a34a" />
            <Typography variant="subtitle1" fontWeight="bold" color="#166534">Import Complete</Typography>
          </Box>
          <Typography variant="body2" color="#166534">Imported: {results.imported} | Skipped: {results.skipped}</Typography>
        </Box>
      )}

      {(importing || processing) && (
        <Box sx={{ mt: 4 }}>
          <PhasePulseScanner 
            isScanning={importing || processing} 
            title="Ingestion & AI Pipeline"
            subtitle={importing ? "Phase 1: Securely copying files to local library..." : "Phase 2-4: Processing photos through Celery background workers..."}
            mainIcon={Upload}
            phases={[
              { id: 1, title: 'Phase 1: Local Ingestion', description: 'Copying files and calculating hashes to prevent duplicates...', icon: Copy },
              { id: 2, title: 'Phase 2: Quality Assessment', description: 'Scoring image sharpness, exposure, and resolution...', icon: ImageIcon },
              { id: 3, title: 'Phase 3: Semantic Analysis', description: 'Generating CLIP embeddings and checking for WhatsApp forwards...', icon: Cpu },
              { id: 4, title: 'Phase 4: Biometric Scan', description: 'Detecting faces and extracting InsightFace vectors...', icon: Database }
            ]}
          />
        </Box>
      )}
    </Box>
  );
}