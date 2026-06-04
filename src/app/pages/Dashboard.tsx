import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import {
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Copy,
  Users,
  MapPin,
  Calendar,
  Upload,
  Eye
} from 'lucide-react';
import { mockStats, mockPhotos } from '../data/mockData';

export default function Dashboard() {
  const processingProgress = (mockStats.processed / mockStats.totalPhotos) * 100;

  const categoryData = [
    { id: 'useful', name: 'Useful', value: mockStats.organized },
    { id: 'spam', name: 'Spam', value: 156 },
    { id: 'greetings', name: 'Greetings', value: 78 },
    { id: 'duplicates', name: 'Duplicates', value: mockStats.duplicates },
  ];

  const recentPhotos = mockPhotos.filter(p => p.status === 'processed').slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-gray-600 mt-1">Overview of your photo library</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
            <ImageIcon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalPhotos.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {mockStats.imported} imported
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.processed}</div>
            <Progress value={processingProgress} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {processingProgress.toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Duplicates Found</CardTitle>
            <Copy className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.duplicates}</div>
            <p className="text-xs text-gray-500 mt-1">
              Can be removed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.rejected}</div>
            <p className="text-xs text-gray-500 mt-1">
              WhatsApp forwards & spam
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">People Detected</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.peopleDetected}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across {mockStats.organized} photos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.locationsFound}</div>
            <p className="text-xs text-gray-500 mt-1">
              From GPS metadata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occasions</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.occasionsIdentified}</div>
            <p className="text-xs text-gray-500 mt-1">
              Auto-detected categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Classification Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.id}>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-gray-600">{category.value} photos</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${(category.value / mockStats.totalPhotos) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import More Photos
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Review Classifications
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Review Duplicates
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Train Face Recognition
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Processed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentPhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.thumbnail}
                  alt={photo.filename}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="text-white text-xs text-center p-2">
                    <p className="font-semibold">{photo.filename}</p>
                    {photo.qualityScore && (
                      <p className="mt-1">Quality: {photo.qualityScore}/100</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
