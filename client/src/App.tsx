import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import Dashboard from '@/components/dashboard/Dashboard';
import QueryList from '@/components/queries/QueryList';
import QueryForm from '@/components/queries/QueryForm';
import QueryDetail from '@/components/queries/QueryDetail';
import DealsPage from '@/components/DealsPage';
import Profile from '@/components/auth/Profile';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryContext';
import { DealProvider } from '@/context/DealContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QueryProvider>
          <DealProvider>
            <div className="app">
              <Header />
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
            </div>
          </DealProvider>
        </QueryProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;