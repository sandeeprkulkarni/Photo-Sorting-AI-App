import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Box, Grid, Chip, Stack, CircularProgress } from '@mui/material';
import { Copy, Search, ShieldAlert, CheckCircle, Info, Check } from 'lucide-react';
// FIX 1: Import API_BASE_URL so we always use the correct port!
import { api, API_BASE_URL } from '../services/api';
import PhasePulseScanner from '../components/PhasePulseScanner';

interface Photo {
  id: number;
  file_path: string;
  original_filename?: string;
  quality_score: number;
  width: number;
  height: number;
  file_size: number;
  is_best_in_group: boolean;
}

interface DuplicateGroup {
  id: string;
  similarity_score: number;
  detection_method: string;
  photos: Photo[];
}

export default function Duplicates() {
  // --- Scanning & Background Task State ---
  const savedTaskId = localStorage.getItem('duplicatesTaskId');
  const [processing, setProcessing] = useState(!!savedTaskId);
  const [taskId, setTaskId] = useState<string | null>(savedTaskId);
  const [statusText, setStatusText] = useState('');

  // --- Duplicate Groups Data State ---
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch groups when page loads or after scan completes
  const fetchGroups = async () => {
    setLoading(true);
    try {
      // Safely handle different potential backend response formats
      const response = await api.get('/duplicates/groups');
      const fetchedGroups = response.data.groups || response.data.duplicate_groups || response.data || [];
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Failed to fetch duplicate groups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!processing) fetchGroups();
  }, [processing]);

  // Polling Effect for Background Task
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/progress/task/${taskId}`);
          const { state, status } = response.data;
          
          setStatusText(`Status: ${state} | ${status || 'Processing...'}`);

          if (state === 'SUCCESS') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('duplicatesTaskId');
            fetchGroups(); // Refresh list after scan
          } else if (state === 'FAILURE') {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('duplicatesTaskId');
            alert('Background task failed. Check backend logs.');
          }
        } catch (error: any) {
          if (error.response?.status === 404 || error.response?.status === 500) {
            clearInterval(interval);
            setProcessing(false);
            setTaskId(null);
            localStorage.removeItem('duplicatesTaskId');
          }
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [taskId]);

  const handleStartDetection = async () => {
    setProcessing(true);
    setStatusText('Dispatching task to background workers...');
    try {
      const response = await api.post('/duplicates/detect');
      setTaskId(response.data.task_id);
      localStorage.setItem('duplicatesTaskId', response.data.task_id);
    } catch (error) {
      console.error("Failed to start detection", error);
      alert("Error triggering duplicate detection.");
      setProcessing(false);
    }
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  // --- Derived Statistics ---
  const totalPhotos = groups.reduce((acc, group) => acc + group.photos.length, 0);
  const totalBytesFreed = groups.reduce((acc, group) => {
    // Sum the size of all photos EXCEPT the one marked as best
    const wastedBytes = group.photos
      .filter(p => !p.is_best_in_group)
      .reduce((sum, p) => sum + (p.file_size || 0), 0);
    return acc + wastedBytes;
  }, 0);
  const freedMB = (totalBytesFreed / (1024 * 1024)).toFixed(1);

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Duplicate Photos</Typography>
          <Typography variant="body1" color="text.secondary">Review and remove duplicate photos</Typography>
        </Box>
        
        <Button 
          variant="contained" 
          size="large"
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <Search size={20} />}
          onClick={handleStartDetection}
          disabled={processing}
          sx={{ backgroundColor: '#0f172a', textTransform: 'none', px: 4, py: 1.5, borderRadius: '8px', '&:hover': { backgroundColor: '#1e293b' } }}
        >
          {processing ? 'Scanning in Background...' : 'Scan for Duplicates'}
        </Button>
      </Box>

      {/* Scanner Animation */}
      {processing && (
        <Box mb={4}>
          <PhasePulseScanner 
            isScanning={processing} 
            title="Deep Duplicate Analysis"
            subtitle={statusText || "Running perceptual hashing and semantic CLIP comparisons..."}
            mainIcon={Copy}
            phases={[
              { id: 1, title: 'Phase 1: Hash Extraction', description: 'Generating MD5 checksums for exact file matches...', icon: ShieldAlert },
              { id: 2, title: 'Phase 2: Perceptual Analysis', description: 'Calculating image structure and color distributions...', icon: Search },
              { id: 3, title: 'Phase 3: Semantic Matching', description: 'Comparing CLIP embeddings for contextual duplicates...', icon: Copy },
              { id: 4, title: 'Phase 4: Group Generation', description: 'Linking identified matches and scoring visual similarity...', icon: CheckCircle }
            ]}
          />
        </Box>
      )}

      {/* Loading State */}
      {loading && !processing && (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      )}

      {/* Empty State */}
      {!loading && !processing && groups.length === 0 && (
         <Box sx={{ mt: 4, textAlign: 'center', border: '2px dashed #e5e7eb', borderRadius: '16px', p: 8, backgroundColor: '#fafafa' }}>
            <Copy size={48} color="#9ca3af" style={{ margin: '0 auto', marginBottom: '16px' }} />
            <Typography variant="h6" fontWeight="600" mb={1}>No Duplicates Found</Typography>
            <Typography variant="body2" color="text.secondary">
              Your library looks clean! Click the scan button above to analyze your photos.
            </Typography>
         </Box>
      )}

      {/* Results View */}
      {!loading && !processing && groups.length > 0 && (
        <Stack spacing={4}>
          
          {/* Summary Box */}
          <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', p: 3, pb: "24px !important" }}>
              <Info size={20} color="#4b5563" style={{ marginTop: '2px', marginRight: '12px' }} />
              <Box>
                <Typography variant="body2" color="text.secondary" mb={0.5}>Found</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="#111827">
                  {groups.length} duplicate groups
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  containing {totalPhotos} photos. Removing duplicates will free up approximately {freedMB} MB of storage.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Group Cards */}
          {groups.map((group, index) => (
            <DuplicateGroupCard 
              key={group.id} 
              index={index} 
              group={group} 
              onResolved={() => handleRemoveGroup(group.id)} 
            />
          ))}

        </Stack>
      )}
    </Box>
  );
}

// --- Sub-component for individual duplicate groups ---
function DuplicateGroupCard({ group, index, onResolved }: { group: DuplicateGroup, index: number, onResolved: () => void }) {
  // Default selection to the AI recommended best photo
  const bestPhoto = group.photos.find(p => p.is_best_in_group) || group.photos[0];
  const [selectedPhotoId, setSelectedPhotoId] = useState<number>(bestPhoto?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatMethod = (method: string) => {
    if (method === 'exact_hash') return 'Exact Hash';
    if (method === 'perceptual_hash') return 'Perceptual Hash';
    if (method === 'semantic_clip') return 'Semantic Match';
    return method;
  };

  const handleKeepSelected = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/duplicates/${group.id}/set-best`, { photo_id: selectedPhotoId });
      onResolved();
    } catch (error) {
      console.error("Failed to resolve duplicate group", error);
      setIsSubmitting(false);
    }
  };

  // --- NEW: Handle rejecting the entire group ---
  const handleRejectAll = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/duplicates/${group.id}/reject-all`);
      onResolved(); // Hide the group from UI
    } catch (error) {
      console.error("Failed to reject entire group", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ p: 4, pb: "32px !important" }}>
        
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">Duplicate Group #{index + 1}</Typography>
          <Chip 
            label={`${Math.round(group.similarity_score * 100)}% Similar - ${formatMethod(group.detection_method)}`}
            sx={{ backgroundColor: '#0f172a', color: 'white', fontWeight: 600, borderRadius: '6px' }}
          />
        </Box>

        {/* Photos Grid */}
        <Grid container spacing={3} mb={4}>
          {group.photos.map(photo => {
            const isSelected = selectedPhotoId === photo.id;
            const fileSizeMB = photo.file_size ? (photo.file_size / (1024 * 1024)).toFixed(1) : '0.0';
            const filename = photo.original_filename || photo.file_path.split('\\').pop() || 'Unknown';

            return (
              <Grid item xs={12} sm={6} md={4} key={photo.id}>
                <Card 
                  onClick={() => setSelectedPhotoId(photo.id)}
                  sx={{ 
                    cursor: 'pointer',
                    borderRadius: '12px', 
                    border: isSelected ? '3px solid #3b82f6' : '1px solid #e5e7eb',
                    boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Selection Checkmark */}
                  {isSelected && (
                    <Box sx={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#3b82f6', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                      <Check size={16} color="white" />
                    </Box>
                  )}

                  {/* AI Recommended Badge */}
                  {photo.is_best_in_group && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                      <Chip label="AI Recommended" sx={{ backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold', height: 24, fontSize: '0.7rem' }} />
                    </Box>
                  )}

                  <Box sx={{ width: '100%', height: '200px', backgroundColor: '#f3f4f6' }}>
                    <img src={`${API_BASE_URL}/duplicates/photo/${photo.id}/image`} alt={filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>

                  <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="600" mb={1} sx={{ wordBreak: 'break-all' }}>
                      {filename}
                    </Typography>
                    
                    <Stack spacing={0.5}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">{photo.width} × {photo.height}</Typography>
                        <Typography variant="caption" color="text.secondary">{fileSizeMB} MB</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Quality:</Typography>
                        <Typography variant="caption" fontWeight="bold">{Math.round(photo.quality_score)}/100</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Footer Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" pt={3} borderTop="1px solid #f3f4f6">
          <Typography variant="body2" color="text.secondary">
            Select the photo you want to keep. Others will be moved to trash.
          </Typography>
          <Box display="flex" gap={2}>
            {/* NEW: Delete Entire Group button */}
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleRejectAll}
              disabled={isSubmitting}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Delete Entire Group
            </Button>

            <Button 
              variant="outlined" 
              onClick={onResolved}
              disabled={isSubmitting}
              sx={{ color: '#374151', borderColor: '#d1d5db', borderRadius: '8px', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: '#f9fafb', borderColor: '#9ca3af' } }}
            >
              Skip Group
            </Button>
            <Button 
              variant="contained" 
              onClick={handleKeepSelected}
              disabled={isSubmitting}
              sx={{ backgroundColor: '#0f172a', borderRadius: '8px', textTransform: 'none', px: 3, fontWeight: 600, '&:hover': { backgroundColor: '#1e293b' } }}
            >
              {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Keep Selected Photo'}
            </Button>
          </Box>
        </Box>

      </CardContent>
    </Card>
  );
}