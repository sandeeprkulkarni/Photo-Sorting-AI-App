import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, X, RotateCcw } from 'lucide-react';
import { mockPhotos } from '../data/mockData';

export default function Review() {
  const classifiedPhotos = mockPhotos.filter(p => p.category && p.status === 'classified');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const currentPhoto = classifiedPhotos[currentIndex];

  const handleKeep = () => {
    setReviewed(reviewed + 1);
    nextPhoto();
  };

  const handleReject = () => {
    setReviewed(reviewed + 1);
    nextPhoto();
  };

  const handleRecategorize = (newCategory: string) => {
    setReviewed(reviewed + 1);
    nextPhoto();
  };

  const nextPhoto = () => {
    if (currentIndex < classifiedPhotos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (currentIndex >= classifiedPhotos.length) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">All Photos Reviewed!</h2>
            <p className="text-gray-600 mb-6">
              You've reviewed {reviewed} photos. Great job!
            </p>
            <Button onClick={() => { setCurrentIndex(0); setReviewed(0); }}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Review Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spam':
        return 'destructive';
      case 'greetings':
        return 'secondary';
      case 'sensitive':
        return 'destructive';
      case 'useful':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Review Classifications</h2>
          <p className="text-gray-600 mt-1">Review and correct AI classifications</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Progress</p>
          <p className="text-2xl font-bold">
            {currentIndex + 1} / {classifiedPhotos.length}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Photo Display */}
            <div>
              <img
                src={currentPhoto.url}
                alt={currentPhoto.filename}
                className="w-full rounded-lg shadow-lg"
              />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Filename:</span>
                  <span className="font-medium">{currentPhoto.filename}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">
                    {currentPhoto.width} × {currentPhoto.height}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">File Size:</span>
                  <span className="font-medium">
                    {(currentPhoto.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                {currentPhoto.qualityScore && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quality:</span>
                    <span className="font-medium">{currentPhoto.qualityScore}/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Classification Info */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">AI Classification</h3>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={getCategoryColor(currentPhoto.category!)}>
                    {currentPhoto.category?.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Confidence: {((currentPhoto.confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {currentPhoto.category === 'spam' && 'Detected as promotional or spam content'}
                  {currentPhoto.category === 'greetings' && 'Detected as greeting or forwarded message'}
                  {currentPhoto.category === 'useful' && 'Personal photo worth keeping'}
                  {currentPhoto.category === 'sensitive' && 'Potentially sensitive content'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">What would you like to do?</h3>
                <div className="space-y-3">
                  <Button onClick={handleKeep} className="w-full" size="lg">
                    <Check className="mr-2 h-5 w-5" />
                    Keep - Classification is Correct
                  </Button>
                  <Button onClick={handleReject} variant="destructive" className="w-full" size="lg">
                    <X className="mr-2 h-5 w-5" />
                    Reject - Delete This Photo
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Or Recategorize As:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleRecategorize('useful')}
                    variant="outline"
                    size="sm"
                  >
                    Useful
                  </Button>
                  <Button
                    onClick={() => handleRecategorize('spam')}
                    variant="outline"
                    size="sm"
                  >
                    Spam
                  </Button>
                  <Button
                    onClick={() => handleRecategorize('greetings')}
                    variant="outline"
                    size="sm"
                  >
                    Greetings
                  </Button>
                  <Button
                    onClick={() => handleRecategorize('sensitive')}
                    variant="outline"
                    size="sm"
                  >
                    Sensitive
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-600">
                  💡 <strong>Tip:</strong> Your corrections help improve AI accuracy over time
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
