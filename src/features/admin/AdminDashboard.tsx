// ============================================================
// Admin Dashboard — Manage doctors and secretaries (UC2-5)
// UPDATED: Now fetches data from MySQL via API
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/auth';
import { api } from '@/shared/api';
import { logger } from '@/shared/logger';
import type { Doctor, Secretary, Patient, Appointment } from '@/shared/types';
import {
  Plus,
  Pencil,
  Trash2,
  Key,
  X,
  Save,
  Users,
  Stethoscope,
  UserCog,
  Calendar,
} from 'lucide-react';

interface AdminDashboardProps {
  view: string;
}

export default function AdminDashboard({ view }: AdminDashboardProps) {
  const { refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Doctor | Secretary | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<Doctor | Secretary | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Form state
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the generic getUsers endpoint or specific ones if available
      // For this implementation, we'll use specific filters or separate calls
      const [docsData, secsData, patsData, aptsData] = await Promise.all([
        api.getUsersByRole('doctor'),
        api.getUsersByRole('secretary'),
        api.getPatients(),
        api.getAppointments()
      ]);
      
      setDoctors(docsData as Doctor[]);
      setSecretaries(secsData as Secretary[]);
      setPatients(patsData);
      setAppointments(aptsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, view]);

  const isDoctors = view === 'doctors';
  const staff = isDoctors ? doctors : secretaries;
  const role = isDoctors ? 'doctor' : 'secretary';

  function openCreateModal() {
    setEditingUser(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormSpecialization('');
    setError('');
    setShowModal(true);
  }

  function openEditModal(user: Doctor | Secretary) {
    setEditingUser(user);
    setFormFirstName(user.firstName);
    setFormLastName(user.lastName);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormSpecialization('specialization' in user ? user.specialization : '');
    setFormPassword('');
    setError('');
    setShowModal(true);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formFirstName || !formLastName || !formEmail) {
      setError('Prénom, nom et email sont obligatoires.');
      return;
    }

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone,
          ...(isDoctors ? { specialization: formSpecialization } : {})
        });
        logger.info('Staff account updated via API', { id: editingUser.id });
        setSuccess('Compte modifié avec succès.');
      } else {
        if (!formPassword) {
          setError('Le mot de passe est obligatoire pour un nouveau compte.');
          return;
        }
        await api.createUser({
          email: formEmail,
          password: formPassword,
          role,
          firstName: formFirstName,
          lastName: formLastName,
          phone: formPhone,
          ...(isDoctors ? { specialization: formSpecialization } : {})
        });
        logger.info('Staff account created via API', { email: formEmail, role });
        setSuccess('Compte créé avec succès.');
      }
      setShowModal(false);
      loadData();
      refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    }
  };

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!showPasswordModal || !newPassword) return;
    try {
      await api.changePassword(showPasswordModal.id, newPassword);
      logger.info('Password changed via API', { id: showPasswordModal.id });
      setSuccess('Mot de passe changé avec succès.');
      setShowPasswordModal(null);
      setNewPassword('');
    } catch (err) {
      setError('Erreur lors du changement de mot de passe.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteUser(id);
      logger.info('Staff account deleted via API', { id });
      setDeleteConfirm(null);
      setSuccess('Compte supprimé avec succès.');
      loadData();
    } catch (err) {
      setError('Erreur lors de la suppression.');
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div></div>;
  }

  if (view === 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
          <h2 className="text-2xl font-bold">Tableau de Bord Admin</h2>
          <p className="mt-1 text-purple-100">Vue d'ensemble de l'activité du cabinet</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg"><Stethoscope size={20} className="text-teal-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
                <p className="text-sm text-gray-500">Médecins</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><UserCog size={20} className="text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{secretaries.length}</p>
                <p className="text-sm text-gray-500">Secrétaires</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                <p className="text-sm text-gray-500">Patients</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><Calendar size={20} className="text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                <p className="text-sm text-gray-500">Rendez-vous</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Derniers membres du personnel</h3>
            <div className="space-y-4">
              {[...doctors, ...secretaries].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${u.role === 'doctor' ? 'bg-teal-50 text-teal-700' : 'bg-green-50 text-green-700'}`}>
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Logs Système Récents</h3>
            <div className="space-y-3">
              {logger.getLogs().slice(-5).reverse().map((log, i) => (
                <div key={i} className="text-xs p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                  <div className="flex justify-between font-medium">
                    <span className={log.level === 'ERROR' ? 'text-red-600' : log.level === 'WARN' ? 'text-orange-600' : 'text-blue-600'}>
                      {log.level}
                    </span>
                    <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Icon = isDoctors ? Stethoscope : UserCog;
  const title = isDoctors ? 'Médecins' : 'Secrétaires';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDoctors ? 'bg-teal-100' : 'bg-green-100'}`}>
            <Icon size={24} className={isDoctors ? 'text-teal-600' : 'text-green-600'} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{staff.length} membre(s) enregistré(s)</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Ajouter {isDoctors ? 'un médecin' : 'une secrétaire'}
        </button>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          {success}
          <button onClick={() => setSuccess('')}><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${isDoctors ? 'bg-teal-500' : 'bg-green-500'}`}></div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                  isDoctors ? 'bg-teal-100 text-teal-700' : 'bg-green-100 text-green-700'
                }`}>
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {isDoctors ? 'Dr. ' : ''}{member.firstName} {member.lastName}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  <p className="text-xs text-gray-400">{member.phone || 'Sans téléphone'}</p>
                  {'specialization' in member && (
                    <span className="inline-block mt-1 text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      {member.specialization}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEditModal(member)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                <button onClick={() => setShowPasswordModal(member)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><Key size={16} /></button>
                <button onClick={() => setDeleteConfirm(member.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>

            {deleteConfirm === member.id && (
              <div className="absolute inset-0 bg-white/95 flex items-center justify-center p-4 z-10 animate-in fade-in">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900 mb-3">Confirmer la suppression ?</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleDelete(member.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">Supprimer</button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200">Annuler</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals remain the same but use api calls */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUser ? 'Modifier' : 'Ajouter'} {isDoctors ? 'Médecin' : 'Secrétaire'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={formFirstName}
                    onChange={e => setFormFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={e => setFormLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              {isDoctors && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Spécialisation</label>
                  <input
                    type="text"
                    value={formSpecialization}
                    onChange={e => setFormSpecialization(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              )}
              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mot de passe *</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="order-2 sm:order-1 flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="order-1 sm:order-2 flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700 shadow-md shadow-teal-100 transition-colors"
                >
                  <Save size={18} />
                  {editingUser ? 'Sauvegarder' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowPasswordModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Nouveau mot de passe</h3>
              <button onClick={() => setShowPasswordModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPasswordModal(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700 shadow-md shadow-teal-100">Modifier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
