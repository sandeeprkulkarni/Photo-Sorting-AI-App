import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, Info } from 'lucide-react';
import { mockPhotos } from '../data/mockData';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Duplicates() {
  const duplicatePhotos = mockPhotos.filter(p => p.isDuplicate && p.duplicateGroupId === 'dup-001');
  const [selectedPhoto, setSelectedPhoto] = useState(duplicatePhotos.find(p => p.isBestInGroup)?.id);

  const handleKeepSelection = () => {
    alert(`Kept photo ${selectedPhoto}. Other duplicates will be moved to trash.`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Duplicate Photos</h2>
        <p className="text-gray-600 mt-1">Review and remove duplicate photos</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Found <strong>52 duplicate groups</strong> containing 156 photos. Removing duplicates will free up approximately 450 MB of storage.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Duplicate Group #1</CardTitle>
            <Badge>96% Similar - Perceptual Hash</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {duplicatePhotos.map((photo) => (
              <div
                key={photo.id}
                className={`relative cursor-pointer border-4 rounded-lg transition-all ${
                  selectedPhoto === photo.id ? 'border-blue-500 shadow-lg' : 'border-transparent'
                }`}
                onClick={() => setSelectedPhoto(photo.id)}
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full rounded-lg"
                />

                {photo.isBestInGroup && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500">AI Recommended</Badge>
                  </div>
                )}

                {selectedPhoto === photo.id && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                )}

                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-medium truncate">{photo.filename}</p>
                  <div className="flex justify-between text-gray-600">
                    <span>{photo.width} × {photo.height}</span>
                    <span>{(photo.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  {photo.qualityScore && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality:</span>
                      <span className="font-semibold">{photo.qualityScore}/100</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-600">
              Select the photo you want to keep. Others will be moved to trash.
            </p>
            <div className="flex gap-2">
              <Button variant="outline">Skip Group</Button>
              <Button onClick={handleKeepSelection} disabled={!selectedPhoto}>
                Keep Selected Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duplicate Detection Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold">28</p>
              <p className="text-sm text-gray-600">Exact Duplicates</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold">18</p>
              <p className="text-sm text-gray-600">Perceptual Matches</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold">6</p>
              <p className="text-sm text-gray-600">Semantic Similar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
