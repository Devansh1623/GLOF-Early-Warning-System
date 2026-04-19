import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { I18nProvider } from './utils/I18nContext';
import { SSEProvider } from './utils/SSEContext';
import Sidebar from './components/Sidebar';
import NotificationToast from './components/NotificationToast';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardHome from './pages/DashboardHome';
import MapPage from './pages/MapPage';
import ChartsPage from './pages/ChartsPage';
import AlertsPage from './pages/AlertsPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import EventsPage from './pages/EventsPage';
import AdminPage from './pages/AdminPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import AboutPage from './pages/AboutPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function DashboardLayout({ children }) {
  return (
    <SSEProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </SSEProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout><DashboardHome /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/map" element={
        <ProtectedRoute>
          <DashboardLayout><MapPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/charts" element={
        <ProtectedRoute>
          <DashboardLayout><ChartsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/alerts" element={
        <ProtectedRoute>
          <DashboardLayout><AlertsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/notifications" element={
        <ProtectedRoute>
          <DashboardLayout><NotificationCenterPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/events" element={
        <ProtectedRoute>
          <DashboardLayout><EventsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin" element={
        <ProtectedRoute>
          <DashboardLayout><AdminPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <I18nProvider>
        <AuthProvider>
          <NotificationToast />
          <AppRoutes />
        </AuthProvider>
      </I18nProvider>
    </Router>
  );
}
