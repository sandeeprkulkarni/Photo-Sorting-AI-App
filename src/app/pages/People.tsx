import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { UserPlus, Upload, Users } from 'lucide-react';
import { mockPeople, mockPhotos } from '../data/mockData';

export default function People() {
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [trainingName, setTrainingName] = useState('');
  const [trainingPhotos, setTrainingPhotos] = useState(0);

  const handleTrain = () => {
    alert(`Training ${trainingName} with ${trainingPhotos} photos...`);
  };

  const selectedPersonData = mockPeople.find(p => p.id === selectedPerson);
  const personPhotos = selectedPerson
    ? mockPhotos.filter(p => p.people?.includes(selectedPersonData?.name || ''))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">People</h2>
          <p className="text-gray-600 mt-1">Manage face recognition and organize by people</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Train New Person
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Train Face Recognition</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Person's Name</label>
                <Input
                  placeholder="Enter name"
                  value={trainingName}
                  onChange={(e) => setTrainingName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Upload 10-20 clear photos</p>
                <Button variant="outline" size="sm" onClick={() => setTrainingPhotos(15)}>
                  Select Photos
                </Button>
                {trainingPhotos > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {trainingPhotos} photos selected
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="font-semibold mb-1">Tips for best results:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Use clear, well-lit photos</li>
                  <li>Include different angles and expressions</li>
                  <li>Ensure face is clearly visible</li>
                  <li>At least 3 photos required, 10+ recommended</li>
                </ul>
              </div>

              <Button onClick={handleTrain} className="w-full" disabled={!trainingName || trainingPhotos < 3}>
                Train Face Recognition
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* People List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recognized People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockPeople.map((person) => (
                <div
                  key={person.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPerson === person.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedPerson(person.id)}
                >
                  <Avatar>
                    {person.avatar ? (
                      <AvatarImage src={person.avatar} />
                    ) : (
                      <AvatarFallback>{person.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-gray-600">{person.photoCount} photos</p>
                  </div>
                  {person.isTrained && (
                    <Badge variant="secondary" className="text-xs">Trained</Badge>
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
              {selectedPersonData ? `Photos of ${selectedPersonData.name}` : 'Select a person'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPerson ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {personPhotos.length > 0 ? (
                  personPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.thumbnail}
                        alt={photo.filename}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center text-white p-2">
                        <p className="text-xs text-center">{photo.filename}</p>
                        {photo.location && (
                          <p className="text-xs mt-1">{photo.location}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No photos found for this person
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a person to view their photos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Face Recognition Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold">4</p>
              <p className="text-sm text-gray-600">Trained People</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold">128</p>
              <p className="text-sm text-gray-600">Faces Detected</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold">120</p>
              <p className="text-sm text-gray-600">Recognized</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-gray-600">Unknown</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
