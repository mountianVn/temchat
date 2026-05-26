import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { socketService } from '@/services/socketService';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import Toasts from '@/components/ui/Toasts';

export default function App() {
  const { isAuthenticated, loadUser, user } = useAuthStore();
  const { theme } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
    return () => socketService.disconnect();
  }, [isAuthenticated, user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
        <Route path="/*" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />} />
      </Routes>
      <Toasts />
    </BrowserRouter>
  );
}
