// ============================================================
// Patient Dashboard — Appointments & History (UC7-11)
// UPDATED: Now fetches data from MySQL via API
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/shared/auth';
import { api } from '@/shared/api';
import { logger } from '@/shared/logger';
import type { Appointment, Doctor, Consultation, AppUser } from '@/shared/types';
import {
  Calendar,
  Clock,
  Plus,
  X,
  Save,
  Ban,
  CheckCircle,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react';

interface PatientDashboardProps {
  view: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
  'no-show': { label: 'Absent', color: 'bg-gray-100 text-gray-800' },
};

export default function PatientDashboard({ view }: PatientDashboardProps) {
  const { user } = useAuth();
  const [showNewApt, setShowNewApt] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  // New appointment form state
  const [selDoctor, setSelDoctor] = useState('');
  const [selDate, setSelDate] = useState('');
  const [selSlot, setSelSlot] = useState('');
  const [aptReason, setAptReason] = useState('');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [aptsData, docsData, consData, usersData] = await Promise.all([
        api.getAppointments({ patientId: user.id }),
        api.getDoctors(),
        api.getConsultations({ patientId: user.id }),
        api.getUsers()
      ]);
      setAppointments(aptsData);
      setDoctors(docsData);
      setConsultations(consData);
      setAllUsers(usersData);
    } catch (err) {
      console.error('Failed to load patient data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData, view]);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    if (selDoctor && selDate) {
      api.getAvailableSlots(selDoctor, selDate).then(setAvailableSlots);
    } else {
      setAvailableSlots([]);
    }
  }, [selDoctor, selDate]);

  if (!user) return null;
  const uid = user.id;

  const upcomingApts = appointments.filter(a => a.date >= today && a.status !== 'cancelled');
  const pastApts = appointments.filter(a => a.date < today || a.status === 'completed' || a.status === 'cancelled');

  async function handleNewAppointment(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selDoctor || !selDate || !selSlot) {
      setError('Veuillez sélectionner un médecin, une date et un créneau.');
      return;
    }

    try {
      // Re-read available slots from API to prevent overlap
      const freshSlots = await api.getAvailableSlots(selDoctor, selDate);
      const slot = freshSlots.find((s: { start: string }) => s.start === selSlot);
      if (!slot) {
        setError('Ce créneau vient d\'être réservé. Veuillez en choisir un autre.');
        return;
      }

      await api.createAppointment({
        patientId: uid,
        doctorId: selDoctor,
        date: selDate,
        timeSlot: slot,
        status: 'pending',
        reason: aptReason || 'Consultation',
      });

      logger.info('Appointment requested via API', { patientId: uid, doctorId: selDoctor, date: selDate });
      setSuccess('Rendez-vous demandé avec succès.');
      setShowNewApt(false);
      setSelDoctor('');
      setSelDate('');
      setSelSlot('');
      setAptReason('');
      loadData();
    } catch (err) {
      setError('Erreur lors de la prise de rendez-vous.');
    }
  }

  async function handleCancel(id: string) {
    try {
      await api.cancelAppointment(id);
      logger.info('Appointment cancelled via API', { appointmentId: id });
      setSuccess('Rendez-vous annulé.');
      loadData();
    } catch (err) {
      setError('Erreur lors de l\'annulation.');
    }
  }

  function DoctorName({ id }: { id: string }) {
    const doc = allUsers.find(u => u.id === id);
    return <span>Dr. {doc ? `${doc.firstName} ${doc.lastName}` : 'Inconnu'}</span>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div></div>;
  }

  // ---- DASHBOARD VIEW ----
  if (view === 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Bonjour, {user.firstName} !</h2>
          <p className="mt-1 text-teal-100">Vous avez {upcomingApts.length} rendez-vous à venir.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Calendar size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{upcomingApts.length}</p>
                <p className="text-sm text-gray-500">RDV à venir</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pastApts.filter(a => a.status === 'completed').length}</p>
                <p className="text-sm text-gray-500">Consultations</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><FileText size={20} className="text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{consultations.length}</p>
                <p className="text-sm text-gray-500">Ordonnances</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Prochains rendez-vous</h3>
          <div className="space-y-3">
            {upcomingApts.slice(0, 5).map(apt => (
              <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-teal-50 rounded-lg px-3 py-2 min-w-[60px]">
                    <p className="text-xs text-teal-600 font-medium">{new Date(apt.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                    <p className="text-lg font-bold text-teal-700">{new Date(apt.date).getDate()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900"><DoctorName id={apt.doctorId} /></p>
                    <p className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14} /> {apt.timeSlot.start} - {apt.timeSlot.end}</p>
                    <p className="text-xs text-gray-400">{apt.reason}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium self-start sm:self-center ${statusLabels[apt.status].color}`}>
                  {statusLabels[apt.status].label}
                </span>
              </div>
            ))}
            {upcomingApts.length === 0 && <p className="text-gray-400 text-center py-8">Aucun rendez-vous à venir</p>}
          </div>
        </div>
      </div>
    );
  }

  // ---- APPOINTMENTS VIEW ----
  if (view === 'appointments') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Mes rendez-vous</h3>
          <button onClick={() => setShowNewApt(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
            <Plus size={18} /> Nouveau RDV
          </button>
        </div>

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center justify-between animate-in fade-in">
            {success}
            <button onClick={() => setSuccess('')}><X size={16} /></button>
          </div>
        )}

        <div className="space-y-3">
          {appointments.sort((a, b) => b.date.localeCompare(a.date)).map(apt => (
            <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-gray-50 rounded-lg px-3 py-2 min-w-[60px]">
                    <p className="text-xs text-gray-500 font-medium">{new Date(apt.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                    <p className="text-lg font-bold text-gray-700">{new Date(apt.date).getDate()}/{new Date(apt.date).getMonth() + 1}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900"><DoctorName id={apt.doctorId} /></p>
                    <p className="text-sm text-gray-500">{apt.timeSlot.start} - {apt.timeSlot.end}</p>
                    <p className="text-xs text-gray-400">{apt.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusLabels[apt.status].color}`}>
                    {statusLabels[apt.status].label}
                  </span>
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <button onClick={() => handleCancel(apt.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Annuler">
                      <Ban size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>Aucun rendez-vous</p>
            </div>
          )}
        </div>

        {/* New appointment modal */}
        {showNewApt && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowNewApt(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-gray-900">Nouveau rendez-vous</h3>
                <button onClick={() => setShowNewApt(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleNewAppointment} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Médecin *</label>
                  <select value={selDoctor} onChange={e => { setSelDoctor(e.target.value); setSelSlot(''); }} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">Sélectionner un médecin</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date *</label>
                  <input type="date" value={selDate} onChange={e => { setSelDate(e.target.value); setSelSlot(''); }} min={today} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                {selDoctor && selDate && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Créneaux disponibles *</label>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-orange-600 flex items-center gap-1 font-medium"><AlertCircle size={16} /> Aucun créneau disponible</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map(slot => (
                          <button key={slot.start} type="button" onClick={() => setSelSlot(slot.start)} className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${selSlot === slot.start ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50'}`}>
                            {slot.start}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motif</label>
                  <input type="text" value={aptReason} onChange={e => setAptReason(e.target.value)} placeholder="Ex: Consultation, douleur..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewApt(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" className="flex-1 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700 shadow-md transition-colors"><Save size={18} className="inline mr-2" />Confirmer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- HISTORY VIEW ----
  if (view === 'history') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Mon historique médical</h3>
        {consultations.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucune consultation enregistrée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.sort((a, b) => b.date.localeCompare(a.date)).map(cons => (
              <div key={cons.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg"><Activity size={20} className="text-green-600" /></div>
                      <div>
                        <p className="font-bold text-gray-900">{new Date(cons.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-gray-500"><DoctorName id={cons.doctorId} /></p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold self-start sm:self-center ${cons.isPresent ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                      {cons.isPresent ? 'Présent' : 'Absent'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Diagnostic</p>
                        <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{cons.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Compte-rendu</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{cons.report}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {cons.prescription.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ordonnance</p>
                          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
                            {cons.prescription.map((med, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className="mt-1"><Save size={14} className="text-blue-500" /></div>
                                <div>
                                  <p className="text-sm font-bold text-blue-900">{med.name} <span className="text-xs font-normal opacity-70">({med.dosage})</span></p>
                                  <p className="text-xs text-blue-700 italic">{med.instructions} — {med.duration}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {cons.notes && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes du médecin</p>
                          <p className="text-sm text-gray-600 italic">"{cons.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
