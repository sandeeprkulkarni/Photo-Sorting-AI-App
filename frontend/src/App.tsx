import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, AppBar, Toolbar, Typography } from '@mui/material';
import { Home, Upload, Eye, Users, MapPin, Calendar, Settings as SettingsIcon, Copy, FolderOutput } from 'lucide-react';

import Duplicates from './pages/Duplicates';
import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import Review from './pages/Review';
import People from './pages/People';
import Locations from './pages/Locations';
import Occasions from './pages/Occasions';
import Settings from './pages/Settings';
import Export from './pages/Export';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
  },
});

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Home />, path: '/' },
  { text: 'Import', icon: <Upload />, path: '/import' },
  { text: 'Review', icon: <Eye />, path: '/review' },
  { text: 'Duplicates', icon: <Copy />, path: '/duplicates' },
  { text: 'People', icon: <Users />, path: '/people' },
  { text: 'Locations', icon: <MapPin />, path: '/locations' },
  { text: 'Occasions', icon: <Calendar />, path: '/occasions' },
  { text: 'Export & Sort', icon: <FolderOutput color="#10b981" />, path: '/export' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#0f172a' }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" fontWeight="bold">
                Private Photo Organizer
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: '#f8fafc' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto', mt: 2 }}>
              <List>
                {menuItems.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton component={Link} to={item.path} sx={{ borderRadius: '8px', mx: 1, mb: 0.5, '&:hover': { backgroundColor: '#e2e8f0' } }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
          
          <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <Toolbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import" element={<Import />} />
              <Route path="/review" element={<Review />} />
              <Route path="/duplicates" element={<Duplicates />} />
              <Route path="/people" element={<People />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/occasions" element={<Occasions />} />
              <Route path="/export" element={<Export />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;