// ============================================================
// App — Root component with routing
// ============================================================

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/shared/auth';
import LoginPage from '@/features/auth/LoginPage';
import Layout from '@/components/Layout';
import AdminDashboard from '@/features/admin/AdminDashboard';
import PatientDashboard from '@/features/patient/PatientDashboard';
import SecretaryDashboard from '@/features/secretary/SecretaryDashboard';
import DoctorDashboard from '@/features/doctor/DoctorDashboard';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setCurrentView('dashboard')} />;
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      <DashboardRouter currentView={currentView} onNavigate={setCurrentView} />
    </Layout>
  );
}

function DashboardRouter({ currentView, onNavigate }: { currentView: string; onNavigate: (view: string) => void }) {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard view={currentView === 'dashboard' ? 'dashboard' : currentView} />;
    case 'patient':
      return <PatientDashboard view={currentView} />;
    case 'secretary':
      return <SecretaryDashboard view={currentView} />;
    case 'doctor':
      return <DoctorDashboard view={currentView} onNavigate={onNavigate} />;
    default:
      return <div>Rôle non reconnu</div>;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
