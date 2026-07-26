import React, { useState } from 'react';
import { Button } from '@mui/material';
import { FolderOpen } from 'lucide-react';
import { api } from '../services/api';

export default function Import() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSelectFolder = async () => {
    try {
      // Use Electron API to select folder
      const folderPath = await (window as any).electronAPI.selectFolder();
      
      if (folderPath) {
        setImporting(true);
        const response = await api.post('/photos/import', {
          source_path: folderPath
        });
        setResults(response.data);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Import Photos</h1>
      
      <Button
        variant="contained"
        startIcon={<FolderOpen />}
        onClick={handleSelectFolder}
        disabled={importing}
      >
        {importing ? 'Importing...' : 'Select Folder'}
      </Button>

      {results && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <p>Imported: {results.imported}</p>
          <p>Skipped: {results.skipped}</p>
          {results.errors.length > 0 && (
            <p className="text-red-600">Errors: {results.errors.length}</p>
          )}
        </div>
      )}
    </div>
  );
}