import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { WatchPage } from './pages/WatchPage';
import { ShortsPage } from './pages/ShortsPage';
import { SearchPage } from './pages/SearchPage';
import { UploadPage } from './pages/UploadPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChannelPage } from './pages/ChannelPage';
import { CreatorStudioPage } from './pages/CreatorStudioPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { HistoryPage } from './pages/HistoryPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore, applyThemeToDocument } from './store/useThemeStore';

export default function App() {
  const { checkAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    applyThemeToDocument(theme);
  }, [checkAuth, theme]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="watch/:id" element={<WatchPage />} />
          <Route path="shorts" element={<ShortsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="channel/:id" element={<ChannelPage />} />
          <Route path="studio" element={<CreatorStudioPage />} />
          <Route path="playlists" element={<PlaylistPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPanelPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
