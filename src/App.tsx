import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import PublicSearch from './pages/PublicSearch';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UploadEngine from './pages/UploadEngine';
import JKManagement from './pages/JKManagement';
import AuditLogs from './pages/AuditLogs';
import SurauManagement from './pages/SurauManagement';
import PegawaiManagement from './pages/PegawaiManagement';
import ReportsAI from './pages/ReportsAI';
import UserManagement from './pages/UserManagement';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireAdmin = false, requireSuperAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean, requireSuperAdmin?: boolean }) => {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-gov-blue" size={40} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/" />;

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicSearch />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/upload" element={
            <ProtectedRoute requireAdmin>
              <UploadEngine />
            </ProtectedRoute>
          } />

          <Route path="/admin/jk" element={
            <ProtectedRoute requireAdmin>
              <JKManagement />
            </ProtectedRoute>
          } />

          <Route path="/admin/surau" element={
            <ProtectedRoute requireAdmin>
              <SurauManagement />
            </ProtectedRoute>
          } />

          <Route path="/admin/pegawai" element={
            <ProtectedRoute requireAdmin>
              <PegawaiManagement />
            </ProtectedRoute>
          } />

          <Route path="/admin/reports" element={
            <ProtectedRoute requireAdmin>
              <ReportsAI />
            </ProtectedRoute>
          } />

          <Route path="/admin/audit" element={
            <ProtectedRoute requireAdmin>
              <AuditLogs />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute requireSuperAdmin>
              <UserManagement />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
