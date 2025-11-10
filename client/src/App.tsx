import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DemoBanner from '@/components/DemoBanner';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import Dashboard from '@/components/dashboard/Dashboard';
import QueryList from '@/components/queries/QueryList';
import QueryForm from '@/components/queries/QueryForm';
import QueryDetail from '@/components/queries/QueryDetail';
import DealsPage from '@/components/DealsPage';
import Profile from '@/components/auth/Profile';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryContext';
import { DealProvider } from '@/context/DealContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppConfigProvider } from '@/context/AppConfigContext';
import umami from '@/utils/umami';
import { useUmamiPageTracking } from '@/hooks/useUmamiTracking';

function AppContent() {
  // Track page views on route changes
  useUmamiPageTracking();

  return (
    <div className="app">
      <Header />
      <DemoBanner />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/queries" 
            element={
              <ProtectedRoute>
                <QueryList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/queries/new" 
            element={
              <ProtectedRoute>
                <QueryForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/queries/:id" 
            element={
              <ProtectedRoute>
                <QueryDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/queries/:id/edit" 
            element={
              <ProtectedRoute>
                <QueryForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/deals" 
            element={
              <ProtectedRoute>
                <DealsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

function App() {
  // Initialize Umami analytics on app mount
  useEffect(() => {
    umami.init();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppConfigProvider>
            <Router>
              <AuthProvider>
                <QueryProvider>
                  <DealProvider>
                    <AppContent />
                  </DealProvider>
                </QueryProvider>
              </AuthProvider>
            </Router>
          </AppConfigProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;