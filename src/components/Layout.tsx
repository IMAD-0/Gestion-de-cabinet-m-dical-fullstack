// ============================================================
// Layout — Sidebar + Header + Main content area
// ============================================================

import { useState, type ReactNode } from 'react';
import { useAuth } from '@/shared/auth';
import type { UserRole } from '@/shared/types';
import {
  LogOut,
  Menu,
  UserCog,
  Calendar,
  ClipboardList,
  Users,
  Stethoscope,
  LayoutDashboard,
  FileText,
  Activity,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: ReactNode;
  view: string;
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'admin':
      return [
        { label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, view: 'dashboard' },
        { label: 'Gestion Médecins', icon: <Stethoscope size={20} />, view: 'doctors' },
        { label: 'Gestion Secrétaires', icon: <UserCog size={20} />, view: 'secretaries' },
      ];
    case 'patient':
      return [
        { label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, view: 'dashboard' },
        { label: 'Mes Rendez-vous', icon: <Calendar size={20} />, view: 'appointments' },
        { label: 'Mon Historique', icon: <FileText size={20} />, view: 'history' },
      ];
    case 'secretary':
      return [
        { label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, view: 'dashboard' },
        { label: 'Gestion Patients', icon: <Users size={20} />, view: 'patients' },
        { label: 'Planning RDV', icon: <Calendar size={20} />, view: 'planning' },
      ];
    case 'doctor':
      return [
        { label: 'Tableau de bord', icon: <LayoutDashboard size={20} />, view: 'dashboard' },
        { label: 'Mon Planning', icon: <Calendar size={20} />, view: 'planning' },
        { label: 'Traiter RDV', icon: <ClipboardList size={20} />, view: 'treat' },
        { label: 'Dossiers Patients', icon: <Activity size={20} />, view: 'patient-history' },
      ];
  }
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrateur',
  patient: 'Patient',
  secretary: 'Secrétaire',
  doctor: 'Médecin',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  patient: 'bg-blue-100 text-blue-800',
  secretary: 'bg-green-100 text-green-800',
  doctor: 'bg-teal-100 text-teal-800',
};

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = getNavItems(user.role);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        {/* Logo area */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cabinet Médical</h1>
              <p className="text-xs text-gray-500">Gestion intégrée</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                onNavigate(item.view);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.view
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={24} className="text-gray-600" />
          </button>
          <div className="flex-1 px-4 truncate">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {navItems.find((i) => i.view === currentView)?.label ?? 'Tableau de bord'}
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-sm text-gray-500 truncate max-w-[150px] lg:max-w-none">{user.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
