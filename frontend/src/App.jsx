import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';


import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoomLobby from './pages/RoomLobby';
import DuelPage from './pages/DuelPage';
import ResultPage from './pages/ResultPage';
import Navbar from './components/Navbar';
import MatchHistory from './pages/MatchHistory';  

// Protected route wrapper
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-green-400 font-mono animate-pulse">Loading...</div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// Public-only (redirect if logged in)
const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  return (
    <div className="grid-bg min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/room/:roomId" element={<Protected><RoomLobby /></Protected>} />
        <Route path="/duel/:roomId" element={<Protected><DuelPage /></Protected>} />
        <Route path="/result/:roomId" element={<Protected><ResultPage /></Protected>} />
        <Route path="/history" element={<Protected><MatchHistory /></Protected>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
