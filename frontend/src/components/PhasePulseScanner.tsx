import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { CheckCircle2, Clock } from 'lucide-react';

export interface ScanPhase {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface PhasePulseScannerProps {
  isScanning: boolean;
  title: string;
  subtitle: string;
  mainIcon: React.ElementType;
  phases: ScanPhase[];
}

export default function PhasePulseScanner({ 
  isScanning, 
  title, 
  subtitle, 
  mainIcon: MainIcon, 
  phases 
}: PhasePulseScannerProps) {
  const [activePhase, setActivePhase] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let phaseTimer: NodeJS.Timeout;
    let clockTimer: NodeJS.Timeout;

    if (isScanning) {
      setSecondsElapsed(0);
      setActivePhase(0);

      clockTimer = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);

      phaseTimer = setInterval(() => {
        setSecondsElapsed((elapsed) => {
          if (elapsed < 10) setActivePhase(0);
          else if (elapsed < 45) setActivePhase(1);
          else if (elapsed < 90) setActivePhase(2);
          else setActivePhase(3);
          return elapsed;
        });
      }, 1000);
    }

    return () => {
      clearInterval(phaseTimer);
      clearInterval(clockTimer);
    };
  }, [isScanning]);

  if (!isScanning) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style>
        {`
          @keyframes scanPulse { 0% { left: -30%; } 100% { left: 100%; } }
          @keyframes subtleBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        `}
      </style>
      <Paper sx={{ p: 3, my: 3, bgcolor: '#0f172a', color: 'white', borderRadius: 3, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #1e293b' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid #1e293b' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MainIcon color="#60a5fa" size={32} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e0e7ff', lineHeight: 1.2 }}>{title}</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>{subtitle}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#1e293b', px: 2, py: 1, borderRadius: 2 }}>
            <Clock size={18} color="#60a5fa" />
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#bfdbfe' }}>{formatTime(secondsElapsed)}</Typography>
          </Box>
        </Box>
        <Box sx={{ width: '100%', height: 8, bgcolor: '#1e293b', borderRadius: 4, mb: 4, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', height: '100%', width: '30%', background: 'linear-gradient(90deg, transparent, #3b82f6, #22d3ee, transparent)', animation: 'scanPulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
        </Box>
        <Grid container spacing={2}>
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isDone = index < activePhase;
            const isCurrent = index === activePhase;
            return (
              <Grid item xs={12} sm={6} md={3} key={phase.id}>
                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: isCurrent ? '#3b82f6' : '#1e293b', bgcolor: isCurrent ? 'rgba(59, 130, 246, 0.1)' : (isDone ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.4)'), opacity: (!isCurrent && !isDone) ? 0.4 : 1, transition: 'all 0.3s ease' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Icon size={24} color={isCurrent ? '#60a5fa' : (isDone ? '#34d399' : '#64748b')} style={isCurrent ? { animation: 'subtleBounce 2s infinite' } : {}} />
                    {isDone && <CheckCircle2 size={18} color="#34d399" />}
                    {isCurrent && <Typography sx={{ fontSize: '10px', fontWeight: 'bold', bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', px: 1, py: 0.5, borderRadius: 4 }}>ACTIVE</Typography>}
                  </Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#e2e8f0' }}>{phase.title}</Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
        <Box sx={{ mt: 3, p: 2, bgcolor: '#020617', border: '1px solid #1e293b', borderRadius: 2, display: 'flex', gap: 1 }}>
          <Typography sx={{ color: '#60a5fa', fontFamily: 'monospace', fontWeight: 'bold' }}>$&gt;</Typography>
          <Typography sx={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem' }}>{phases[activePhase]?.description}</Typography>
        </Box>
      </Paper>
    </>
  );
}