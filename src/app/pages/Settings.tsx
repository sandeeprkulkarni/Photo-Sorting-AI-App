import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Settings as SettingsIcon, Shield, Zap, Database } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-gray-600 mt-1">Configure app behavior and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-process imported photos</p>
              <p className="text-sm text-gray-600">Start AI analysis immediately after import</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show notifications</p>
              <p className="text-sm text-gray-600">Get notified when processing completes</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark mode</p>
              <p className="text-sm text-gray-600">Use dark theme throughout the app</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Process photos locally only</p>
              <p className="text-sm text-gray-600">All AI processing happens on your device</p>
            </div>
            <Switch defaultChecked disabled />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable reverse geocoding</p>
              <p className="text-sm text-gray-600">Convert GPS coordinates to location names (requires internet)</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Content safety filter</p>
              <p className="text-sm text-gray-600">Automatically detect and flag sensitive content</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-900">
              <strong>🔒 Privacy Guaranteed:</strong> All photos and data remain on your device.
              No cloud uploads, no tracking, no external services.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <p className="font-medium">Batch processing size</p>
              <span className="text-sm text-gray-600">100 photos</span>
            </div>
            <Slider defaultValue={[100]} min={10} max={500} step={10} />
            <p className="text-sm text-gray-600 mt-1">
              Higher values use more memory but process faster
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <p className="font-medium">Image quality threshold</p>
              <span className="text-sm text-gray-600">70/100</span>
            </div>
            <Slider defaultValue={[70]} min={0} max={100} step={5} />
            <p className="text-sm text-gray-600 mt-1">
              Photos below this score will be flagged for review
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Use GPU acceleration</p>
              <p className="text-sm text-gray-600">Faster processing with NVIDIA GPU (if available)</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable parallel processing</p>
              <p className="text-sm text-gray-600">Process multiple photos simultaneously</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Database Size</p>
              <p className="text-2xl font-bold mt-1">45.2 MB</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Cache Size</p>
              <p className="text-2xl font-bold mt-1">128 MB</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              Clear Cache
            </Button>
            <Button variant="outline" className="w-full">
              Optimize Database
            </Button>
            <Button variant="outline" className="w-full">
              Export Database
            </Button>
            <Button variant="destructive" className="w-full">
              Reset All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Version:</span>
            <span className="font-medium">1.0.0 (Beta)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">AI Models:</span>
            <span className="font-medium">CLIP, InsightFace, PaddleOCR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">License:</span>
            <span className="font-medium">MIT</span>
          </div>
          <div className="pt-4 border-t">
            <Button variant="link" className="p-0 h-auto">Check for Updates</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
