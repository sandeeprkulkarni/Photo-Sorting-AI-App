import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { FolderOpen, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Import() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleImport = () => {
    setImporting(true);
    setProgress(0);
    setResults(null);

    // Simulate import progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setImporting(false);
          setResults({
            imported: 156,
            skipped: 23,
            errors: 2,
            totalSize: '2.4 GB',
            duration: '45 seconds'
          });
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Import Photos</h2>
        <p className="text-gray-600 mt-1">Import photos from your computer for organization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Photos to Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Choose a folder to import</h3>
            <p className="text-gray-600 mb-6">
              Select a folder containing your photos. We'll analyze and organize them automatically.
            </p>
            <Button onClick={handleImport} disabled={importing} size="lg">
              <Upload className="mr-2 h-5 w-5" />
              {importing ? 'Importing...' : 'Select Folder'}
            </Button>
          </div>

          {importing && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Importing photos...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-sm text-gray-600">
                Extracting metadata, calculating hashes, and preparing for AI analysis...
              </p>
            </div>
          )}

          {results && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Import Complete!</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Imported: <span className="font-semibold">{results.imported}</span></div>
                  <div>Skipped: <span className="font-semibold">{results.skipped}</span></div>
                  <div>Errors: <span className="font-semibold">{results.errors}</span></div>
                  <div>Total Size: <span className="font-semibold">{results.totalSize}</span></div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-600">
                    Photos are now being processed in the background. You'll be notified when analysis is complete.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Include subfolders</p>
              <p className="text-sm text-gray-600">Import photos from all subdirectories</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Skip duplicates</p>
              <p className="text-sm text-gray-600">Don't import photos that already exist</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Extract GPS data</p>
              <p className="text-sm text-gray-600">Read location from photo metadata</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Process immediately</p>
              <p className="text-sm text-gray-600">Start AI analysis after import</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['JPG', 'JPEG', 'PNG', 'HEIC', 'WebP', 'RAW', 'CR2', 'NEF'].map((format) => (
              <div key={format} className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-medium">
                .{format.toLowerCase()}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            All formats are supported. RAW files will be converted for preview.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
