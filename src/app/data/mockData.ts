// Mock data for the photo organizer prototype

export interface Photo {
  id: number;
  url: string;
  thumbnail: string;
  filename: string;
  takenDate: string;
  importedDate: string;
  width: number;
  height: number;
  fileSize: number;
  category?: 'spam' | 'greetings' | 'sensitive' | 'useful';
  confidence?: number;
  qualityScore?: number;
  location?: string;
  occasion?: string;
  people?: string[];
  isDuplicate?: boolean;
  duplicateGroupId?: string;
  isBestInGroup?: boolean;
  status: 'pending' | 'classified' | 'processed' | 'rejected' | 'organized';
}

export interface Person {
  id: number;
  name: string;
  photoCount: number;
  isTrained: boolean;
  avatar?: string;
}

export interface DuplicateGroup {
  id: string;
  photos: Photo[];
  similarityScore: number;
  detectionMethod: string;
}

export interface Location {
  name: string;
  photoCount: number;
  coordinates?: { lat: number; lng: number };
}

export interface Occasion {
  name: string;
  photoCount: number;
  icon: string;
}

export const mockPhotos: Photo[] = [
  // WhatsApp Forwards - Spam
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1607827448387-a67db1383b59?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1607827448387-a67db1383b59?w=300',
    filename: 'WhatsApp_Image_2024_01_15.jpg',
    takenDate: '2024-01-15',
    importedDate: '2024-06-01',
    width: 1080,
    height: 1920,
    fileSize: 245000,
    category: 'spam',
    confidence: 0.92,
    qualityScore: 65,
    status: 'classified'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=300',
    filename: 'WhatsApp_Promo_123.jpg',
    takenDate: '2024-02-10',
    importedDate: '2024-06-01',
    width: 1080,
    height: 1080,
    fileSize: 180000,
    category: 'spam',
    confidence: 0.88,
    qualityScore: 55,
    status: 'classified'
  },

  // WhatsApp Forwards - Greetings
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300',
    filename: 'Good_Morning_123.jpg',
    takenDate: '2024-03-01',
    importedDate: '2024-06-01',
    width: 1080,
    height: 1080,
    fileSize: 320000,
    category: 'greetings',
    confidence: 0.95,
    qualityScore: 70,
    status: 'classified'
  },

  // Personal Photos - Family
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300',
    filename: 'IMG_0156.jpg',
    takenDate: '2024-04-15',
    importedDate: '2024-06-01',
    width: 4032,
    height: 3024,
    fileSize: 2800000,
    category: 'useful',
    confidence: 0.89,
    qualityScore: 92,
    location: 'Mumbai, India',
    occasion: 'birthday',
    people: ['Rahul', 'Priya'],
    status: 'processed'
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=300',
    filename: 'IMG_0157.jpg',
    takenDate: '2024-04-15',
    importedDate: '2024-06-01',
    width: 4032,
    height: 3024,
    fileSize: 2650000,
    category: 'useful',
    confidence: 0.91,
    qualityScore: 88,
    location: 'Mumbai, India',
    occasion: 'birthday',
    people: ['Rahul'],
    status: 'processed'
  },

  // Vacation Photos
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300',
    filename: 'IMG_2345.jpg',
    takenDate: '2024-05-20',
    importedDate: '2024-06-01',
    width: 4032,
    height: 3024,
    fileSize: 3200000,
    category: 'useful',
    confidence: 0.87,
    qualityScore: 95,
    location: 'Goa, India',
    occasion: 'vacation',
    people: ['Amit', 'Priya'],
    status: 'processed'
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
    filename: 'IMG_2346.jpg',
    takenDate: '2024-05-20',
    importedDate: '2024-06-01',
    width: 4032,
    height: 3024,
    fileSize: 3100000,
    category: 'useful',
    confidence: 0.93,
    qualityScore: 97,
    location: 'Goa, India',
    occasion: 'vacation',
    status: 'processed'
  },

  // Duplicates
  {
    id: 8,
    url: 'https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=300',
    filename: 'IMG_5678.jpg',
    takenDate: '2024-05-25',
    importedDate: '2024-06-01',
    width: 4032,
    height: 3024,
    fileSize: 2900000,
    category: 'useful',
    qualityScore: 94,
    isDuplicate: true,
    duplicateGroupId: 'dup-001',
    isBestInGroup: true,
    status: 'processed'
  },
  {
    id: 9,
    url: 'https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=300&q=80',
    filename: 'IMG_5679.jpg',
    takenDate: '2024-05-25',
    importedDate: '2024-06-01',
    width: 3024,
    height: 2268,
    fileSize: 1800000,
    category: 'useful',
    qualityScore: 85,
    isDuplicate: true,
    duplicateGroupId: 'dup-001',
    isBestInGroup: false,
    status: 'processed'
  },
  {
    id: 10,
    url: 'https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=800&q=70',
    thumbnail: 'https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=300&q=70',
    filename: 'IMG_5679_edited.jpg',
    takenDate: '2024-05-25',
    importedDate: '2024-06-01',
    width: 2016,
    height: 1512,
    fileSize: 980000,
    category: 'useful',
    qualityScore: 78,
    isDuplicate: true,
    duplicateGroupId: 'dup-001',
    isBestInGroup: false,
    status: 'processed'
  },

  // Wedding Photos
  {
    id: 11,
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300',
    filename: 'Wedding_001.jpg',
    takenDate: '2024-03-10',
    importedDate: '2024-06-01',
    width: 4032,
    height: 3024,
    fileSize: 3500000,
    category: 'useful',
    qualityScore: 96,
    location: 'Singapore',
    occasion: 'wedding',
    people: ['Rahul', 'Sneha'],
    status: 'processed'
  },

  // Food Photos
  {
    id: 12,
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300',
    filename: 'IMG_3456.jpg',
    takenDate: '2024-05-15',
    importedDate: '2024-06-01',
    width: 3024,
    height: 4032,
    fileSize: 2200000,
    category: 'useful',
    qualityScore: 89,
    occasion: 'casual',
    status: 'processed'
  },
];

export const mockPeople: Person[] = [
  {
    id: 1,
    name: 'Rahul',
    photoCount: 45,
    isTrained: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
  },
  {
    id: 2,
    name: 'Priya',
    photoCount: 38,
    isTrained: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
  },
  {
    id: 3,
    name: 'Amit',
    photoCount: 22,
    isTrained: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'
  },
  {
    id: 4,
    name: 'Sneha',
    photoCount: 15,
    isTrained: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
  },
  {
    id: 5,
    name: 'Unknown Faces',
    photoCount: 8,
    isTrained: false,
  },
];

export const mockLocations: Location[] = [
  {
    name: 'Goa, India',
    photoCount: 156,
    coordinates: { lat: 15.2993, lng: 74.1240 }
  },
  {
    name: 'Mumbai, India',
    photoCount: 342,
    coordinates: { lat: 19.0760, lng: 72.8777 }
  },
  {
    name: 'Singapore',
    photoCount: 89,
    coordinates: { lat: 1.3521, lng: 103.8198 }
  },
  {
    name: 'London, UK',
    photoCount: 67,
    coordinates: { lat: 51.5074, lng: -0.1278 }
  },
  {
    name: 'Unknown Location',
    photoCount: 234,
  },
];

export const mockOccasions: Occasion[] = [
  { name: 'Birthday', photoCount: 78, icon: '🎂' },
  { name: 'Wedding', photoCount: 124, icon: '💒' },
  { name: 'Vacation', photoCount: 245, icon: '🏖️' },
  { name: 'Festival', photoCount: 93, icon: '🎉' },
  { name: 'Office', photoCount: 45, icon: '💼' },
  { name: 'Family Gathering', photoCount: 156, icon: '👨‍👩‍👧‍👦' },
  { name: 'Casual', photoCount: 567, icon: '📸' },
];

export const mockDuplicateGroups: DuplicateGroup[] = [
  {
    id: 'dup-001',
    photos: mockPhotos.filter(p => p.duplicateGroupId === 'dup-001'),
    similarityScore: 0.96,
    detectionMethod: 'perceptual_hash'
  },
];

export const mockStats = {
  totalPhotos: 1248,
  imported: 1248,
  processed: 892,
  duplicates: 156,
  whatsappForwards: 234,
  organized: 658,
  rejected: 234,
  peopleDetected: 45,
  locationsFound: 5,
  occasionsIdentified: 7,
};
