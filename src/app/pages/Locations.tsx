import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { MapPin } from 'lucide-react';
import { mockLocations, mockPhotos } from '../data/mockData';

export default function Locations() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const selectedLocationData = mockLocations.find(l => l.name === selectedLocation);
  const locationPhotos = selectedLocation
    ? mockPhotos.filter(p => p.location === selectedLocation)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Locations</h2>
        <p className="text-gray-600 mt-1">Browse photos organized by location</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Locations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockLocations.map((location) => (
                <div
                  key={location.name}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedLocation === location.name ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedLocation(location.name)}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-gray-600">{location.photoCount} photos</p>
                    </div>
                  </div>
                  {location.coordinates && (
                    <Badge variant="secondary" className="text-xs">GPS</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedLocationData ? selectedLocationData.name : 'Select a location'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLocation ? (
              <div className="space-y-4">
                {selectedLocationData?.coordinates && (
                  <div className="bg-gray-100 rounded-lg p-4 h-48 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Map View</p>
                      <p className="text-xs mt-1">
                        {selectedLocationData.coordinates.lat.toFixed(4)}, {selectedLocationData.coordinates.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {locationPhotos.length > 0 ? (
                    locationPhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.thumbnail}
                          alt={photo.filename}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center text-white p-2">
                          <p className="text-xs text-center">{photo.filename}</p>
                          {photo.takenDate && (
                            <p className="text-xs mt-1">{photo.takenDate}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No photos found for this location
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a location to view photos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Detection Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-gray-600">Locations Found</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold">654</p>
              <p className="text-sm text-gray-600">With GPS Data</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold">234</p>
              <p className="text-sm text-gray-600">Unknown</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
