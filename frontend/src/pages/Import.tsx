import React, { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { FolderOpen, Upload, ImageIcon, Cpu, Database, Copy } from 'lucide-react';
import { api } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

export default function Import() {
  // Check local storage the moment the page loads
  const savedTaskId = localStorage.getItem('importTaskId');
  
  const [importing, setImporting] = useState(false);
  // If we found a saved task ID, immediately set processing to true so the scanner shows
  const [processing, setProcessing] = useState(!!savedTaskId);
  const [taskId, setTaskId] = useState<string | null>(savedTaskId);
  const [results, setResults] = useState<any>(null);

  // Poll for Celery progress
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
            localStorage.removeItem('importTaskId'); // Clean up when done
            alert('AI Processing complete for imported photos!');
          } else if (response.data.state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('importTaskId'); // Clean up on fail
            alert('Background AI processing failed.');
          }
        } catch (error: any) {
          console.error("Polling error:", error);
          // If the task was completely lost or cleared from Redis, stop polling
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
        const response = await api.post('/photos/import', { source_path: folderPath });
        setResults(response.data);
        setImporting(false);

        // If Celery picked it up, keep the scanner running and save to local storage
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Import Photos</h1>
      
      <Button
        variant="contained"
        startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <FolderOpen />}
        onClick={handleSelectFolder}
        disabled={importing || processing}
        className="mb-6"
      >
        {importing ? 'Copying Files...' : 'Select Folder'}
      </Button>

      {results && !processing && (
        <div className="mt-6 mb-6 p-4 bg-gray-100 rounded border">
          <p className="font-semibold text-green-700">Imported: {results.imported}</p>
          <p className="font-semibold text-yellow-700">Skipped (Duplicates): {results.skipped}</p>
          {results.errors?.length > 0 && (
            <p className="text-red-600 font-semibold">Errors: {results.errors.length}</p>
          )}
        </div>
      )}

      <div className="mt-4">
        <PhasePulseScanner 
          isScanning={importing || processing} 
          title="Ingestion & AI Pipeline"
          subtitle={
            importing 
              ? "Phase 1: Securely copying files to local library..." 
              : processing 
                ? "Phase 2-4: Processing photos through Celery background workers..." 
                : "Ready to import and process photos"
          }
          mainIcon={Upload}
          phases={[
            { id: 1, title: 'Phase 1: Local Ingestion', description: 'Copying files and calculating hashes to prevent duplicates...', icon: Copy },
            { id: 2, title: 'Phase 2: Quality Assessment', description: 'Scoring image sharpness, exposure, and resolution...', icon: ImageIcon },
            { id: 3, title: 'Phase 3: Semantic Analysis', description: 'Generating CLIP embeddings and checking for WhatsApp forwards...', icon: Cpu },
            { id: 4, title: 'Phase 4: Biometric Scan', description: 'Detecting faces and extracting InsightFace vectors...', icon: Database }
          ]}
        />
      </div>
    </div>
  );
}