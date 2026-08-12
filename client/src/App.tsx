import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthGuard from './components/auth/AuthGuard';
import Login from './pages/Login';
import Register from './pages/Register';
import { usePwaAutoUpdate } from './hooks/usePwaAutoUpdate';

function App() {
  // Automatically update installed PWA app whenever new code is deployed to Vercel
  usePwaAutoUpdate();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<AuthGuard />}>
          <Route path="/" element={<MainLayout />} />
          <Route path="/channels/:serverId/:channelId" element={<MainLayout />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
