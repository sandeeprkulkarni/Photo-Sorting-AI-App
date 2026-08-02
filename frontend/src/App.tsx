import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, AppBar, Toolbar, Typography } from '@mui/material';
import { Home, Upload, Eye, Users, MapPin, Calendar, Settings, Copy } from 'lucide-react';

// Make sure this path matches where your Duplicates page is saved!
import Duplicates from './pages/Duplicates';
import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import Review from './pages/Review';
import People from './pages/People';
import Locations from './pages/Locations';
import Occasions from './pages/Occasions';

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
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div">
                Private Photo Organizer
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {menuItems.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton component={Link} to={item.path}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
          
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import" element={<Import />} />
              <Route path="/review" element={<Review />} />
              <Route path="/duplicates" element={<Duplicates />} />
              <Route path="/people" element={<People />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/occasions" element={<Occasions />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;