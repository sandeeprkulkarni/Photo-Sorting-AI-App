import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { Copy, Search, ShieldAlert, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

export default function Duplicates() {
  const [processing, setProcessing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');

  // Polling Effect: This runs every second while we have a valid taskId
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (taskId) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/progress/task/${taskId}`);
          const { state, status } = response.data;
          
          setStatusText(`Status: ${state} | ${status || 'Processing...'}`);

          // If the task succeeds or fails, stop polling and reset the UI
          if (state === 'SUCCESS') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            alert('Duplicate detection complete!');
            // Here you would normally call a function to refresh your UI with the results
          } else if (state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            alert('Background task failed. Check backend logs.');
          }
        } catch (error) {
          console.error("Error polling task status:", error);
        }
      }, 1000); // Poll every 1 second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskId]);

  const handleStartDetection = async () => {
    setProcessing(true);
    setStatusText('Dispatching task to background workers...');
    try {
      // 1. Tell the backend to start the task
      const response = await api.post('/duplicates/detect');
      
      // 2. Save the task_id to trigger the polling useEffect above
      setTaskId(response.data.task_id);
    } catch (error) {
      console.error("Failed to start detection", error);
      alert("Error triggering duplicate detection.");
      setProcessing(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Duplicate Manager</h1>
          <p className="text-gray-600">Find and merge visually identical or similar photos.</p>
        </div>
        
        <Button 
          variant="contained" 
          startIcon={processing ? <Search className="animate-spin" /> : <Copy />}
          onClick={handleStartDetection}
          disabled={processing}
        >
          {processing ? 'Scanning in Background...' : 'Scan for Duplicates'}
        </Button>
      </div>

      {/* The UI visualizer for the background task */}
      <PhasePulseScanner 
        isScanning={processing} 
        title="Deep Duplicate Analysis"
        subtitle={statusText || "Running perceptual hashing and semantic CLIP comparisons..."}
        mainIcon={Copy}
        phases={[
          { id: 1, title: 'Phase 1: Hash Extraction', description: 'Generating MD5 checksums for exact file matches...', icon: ShieldAlert },
          { id: 2, title: 'Phase 2: Perceptual Analysis', description: 'Calculating image structure and color distributions...', icon: Search },
          { id: 3, title: 'Phase 3: Semantic Matching', description: 'Comparing CLIP embeddings for contextual duplicates...', icon: Copy },
          { id: 4, title: 'Phase 4: Group Generation', description: 'Linking identified matches and scoring visual similarity...', icon: CheckCircle }
        ]}
      />
      
      {!processing && (
         <div className="mt-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg p-12">
            <Copy size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-700">Ready to Scan</h2>
            <p className="mt-2">Click the scan button above to dispatch a background worker to analyze your entire library.</p>
         </div>
      )}
    </div>
  );
}