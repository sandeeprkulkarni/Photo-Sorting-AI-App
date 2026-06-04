import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import Review from './pages/Review';
import Duplicates from './pages/Duplicates';
import People from './pages/People';
import Locations from './pages/Locations';
import Occasions from './pages/Occasions';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-white">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/review" element={<Review />} />
            <Route path="/duplicates" element={<Duplicates />} />
            <Route path="/people" element={<People />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/occasions" element={<Occasions />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}