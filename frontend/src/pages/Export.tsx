import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Box, Radio, RadioGroup, FormControlLabel, CircularProgress } from '@mui/material';
import { FolderOutput, Copy, ArrowRightLeft, ShieldAlert, FileWarning, Check } from 'lucide-react';
import { api } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

export default function Export() {
  const savedTaskId = localStorage.getItem('exportTaskId');
  const [processing, setProcessing] = useState(!!savedTaskId);
  const [taskId, setTaskId] = useState<string | null>(savedTaskId);
  const [statusText, setStatusText] = useState('');
  
  const [destinationPath, setDestinationPath] = useState<string>('');
  const [actionType, setActionType] = useState<'copy' | 'move'>('copy');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/progress/task/${taskId}`);
          const { state, status } = response.data;
          
          setStatusText(`Status: ${state} | ${status || 'Processing...'}`);

          if (state === 'SUCCESS') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('exportTaskId');
            alert('Export and Sorting Complete! Check your destination folder.');
          } else if (state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('exportTaskId');
            alert('Export task failed. Check backend logs.');
          }
        } catch (error: any) {
          if (error.response?.status === 404 || error.response?.status === 500) {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('exportTaskId');
          }
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [taskId]);

  const handleSelectFolder = async () => {
    try {
      const folderPath = await (window as any).electronAPI.selectFolder();
      if (folderPath) {
        setDestinationPath(folderPath);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleStartExport = async () => {
    if (!destinationPath) return;
    
    setProcessing(true);
    setStatusText('Dispatching sort task to background workers...');
    
    try {
      const response = await api.post('/photos/export', { 
        destination_path: destinationPath,
        action: actionType
      });
      setTaskId(response.data.task_id);
      localStorage.setItem('exportTaskId', response.data.task_id);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Error starting export process.');
      setProcessing(false);
    }
  };

  const cardStyle = { borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', mb: 3 };

  return (
    <Box sx={{ p: 4, maxWidth: '900px', margin: '0 auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Export & Organize</Typography>
        <Typography variant="body1" color="text.secondary">Physically sort your photos into a clean folder hierarchy</Typography>
      </Box>

      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={3}>1. Select Destination Folder</Typography>
          
          <Box sx={{ 
            border: '2px dashed #e5e7eb', 
            borderRadius: '12px', 
            p: 4, 
            textAlign: 'center',
            backgroundColor: destinationPath ? '#f0fdf4' : '#fafafa',
            mb: 2
          }}>
            {destinationPath ? (
              <Box>
                <Check size={32} color="#16a34a" style={{ margin: '0 auto', marginBottom: '8px' }} />
                <Typography variant="body1" fontWeight="bold" color="#166534" sx={{ wordBreak: 'break-all' }}>{destinationPath}</Typography>
              </Box>
            ) : (
              <Box>
                <FolderOutput size={48} color="#9ca3af" style={{ margin: '0 auto', marginBottom: '16px' }} />
                <Typography variant="body2" color="text.secondary" mb={2}>Choose an empty folder to export your organized library</Typography>
              </Box>
            )}
            
            <Button
              variant="outlined"
              onClick={handleSelectFolder}
              disabled={processing}
              sx={{ mt: destinationPath ? 2 : 0, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              {destinationPath ? 'Change Destination' : 'Select Destination Folder'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={cardStyle} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={3}>2. File Transfer Method</Typography>
          
          <RadioGroup value={actionType} onChange={(e) => setActionType(e.target.value as 'copy' | 'move')}>
            <Box display="flex" flexDirection="column" gap={2}>
              
              <Box sx={{ p: 2, border: actionType === 'copy' ? '2px solid #3b82f6' : '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }} onClick={() => !processing && setActionType('copy')}>
                <FormControlLabel 
                  value="copy" 
                  control={<Radio />} 
                  label={<Typography fontWeight="bold">Safe Copy (Recommended)</Typography>} 
                  disabled={processing}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Creates a perfectly organized copy of your library in the new folder. Your original messy folders remain completely untouched as a safe backup.
                </Typography>
              </Box>

              <Box sx={{ p: 2, border: actionType === 'move' ? '2px solid #3b82f6' : '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }} onClick={() => !processing && setActionType('move')}>
                <FormControlLabel 
                  value="move" 
                  control={<Radio />} 
                  label={<Typography fontWeight="bold">Physical Move (Saves Space)</Typography>} 
                  disabled={processing}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Physically rips the photos out of your old folders and moves them to the new destination. Cleans up your hard drive, but modifies your original files.
                </Typography>
              </Box>

            </Box>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card sx={{ ...cardStyle, backgroundColor: '#fffbeb', borderColor: '#fed7aa' }} variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <ShieldAlert size={20} color="#d97706" />
            <Typography variant="subtitle1" fontWeight="bold" color="#92400e">The Quarantine Strategy</Typography>
          </Box>
          <Typography variant="body2" color="#92400e" mb={2}>
            To keep your new Year &rarr; Location &rarr; Occasion hierarchy completely pristine, any photo the AI flagged as spam, greetings, or duplicates will be intercepted.
          </Typography>
          <Typography variant="body2" color="#92400e" fontWeight="bold">
            They will be safely routed to a "_To_Delete_" folder at the top of your new destination so you can review and delete them in one click.
          </Typography>
        </CardContent>
      </Card>

      {!processing ? (
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<FolderOutput />}
          onClick={handleStartExport}
          disabled={!destinationPath}
          sx={{ backgroundColor: '#10b981', py: 2, borderRadius: '12px', fontSize: '1.1rem', textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: '#059669' } }}
        >
          Execute Physical Sort
        </Button>
      ) : (
        <Box sx={{ mt: 4 }}>
          <PhasePulseScanner 
            isScanning={processing} 
            title="Executing Hard Drive Sort"
            subtitle={statusText || "Translating database metadata into physical folder hierarchy..."}
            mainIcon={FolderOutput}
            phases={[
              { id: 1, title: 'Phase 1: Quarantine Routing', description: 'Intercepting spam, greetings, and duplicates to _To_Delete_...', icon: FileWarning },
              { id: 2, title: 'Phase 2: Hierarchy Generation', description: 'Building Year -> Location -> Occasion paths...', icon: FolderOutput },
              { id: 3, title: 'Phase 3: File Transfer', description: actionType === 'copy' ? 'Duplicating files to new destination...' : 'Moving files to new destination...', icon: actionType === 'copy' ? Copy : ArrowRightLeft }
            ]}
          />
        </Box>
      )}

    </Box>
  );
}