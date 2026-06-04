import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar } from 'lucide-react';
import { mockOccasions, mockPhotos } from '../data/mockData';

export default function Occasions() {
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);

  const selectedOccasionData = mockOccasions.find(o => o.name.toLowerCase() === selectedOccasion);
  const occasionPhotos = selectedOccasion
    ? mockPhotos.filter(p => p.occasion === selectedOccasion)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Occasions</h2>
        <p className="text-gray-600 mt-1">Browse photos organized by events and occasions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockOccasions.map((occasion) => (
          <Card
            key={occasion.name}
            className={`cursor-pointer transition-all ${
              selectedOccasion === occasion.name.toLowerCase()
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedOccasion(occasion.name.toLowerCase())}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">{occasion.icon}</div>
              <h3 className="font-semibold mb-1">{occasion.name}</h3>
              <p className="text-sm text-gray-600">{occasion.photoCount} photos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedOccasion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedOccasionData?.icon}</span>
              {selectedOccasionData?.name} Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {occasionPhotos.length > 0 ? (
                occasionPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.thumbnail}
                      alt={photo.filename}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center text-white p-2">
                      <p className="text-xs text-center font-medium">{photo.filename}</p>
                      {photo.location && (
                        <p className="text-xs mt-1">{photo.location}</p>
                      )}
                      {photo.people && photo.people.length > 0 && (
                        <p className="text-xs mt-1">👥 {photo.people.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No photos found for this occasion
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedOccasion && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
            <p className="text-gray-500">Select an occasion to view photos</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Occasion Detection Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-gray-600">Occasions</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold">892</p>
              <p className="text-sm text-gray-600">Classified</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold">87%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold">245</p>
              <p className="text-sm text-gray-600">Vacation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
