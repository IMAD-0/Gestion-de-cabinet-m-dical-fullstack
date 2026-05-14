// ============================================================
// Doctor Dashboard — Planning, Treat, Patient History (UC18-27)
// UPDATED: Now fetches data from MySQL via API
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/shared/auth';
import { api } from '@/shared/api';
import type { Appointment, Consultation, Patient, AppUser } from '@/shared/types';
import {
  Calendar,
  ClipboardList,
  Activity,
  Search,
  Clock,
  CheckCircle,
  FileText,
  Plus,
  Save,
  X,
  ChevronRight,
  UserCheck,
  UserX,
  Pill,
  CalendarPlus,
} from 'lucide-react';

interface DoctorDashboardProps {
  view: string;
  onNavigate: (view: string) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
  'no-show': { label: 'Absent', color: 'bg-gray-100 text-gray-800' },
};

export default function DoctorDashboard({ view, onNavigate }: DoctorDashboardProps) {
  const { user } = useAuth();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allConsultations, setAllConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);

  // Treat appointment state
  const [treatingAptId, setTreatingAptId] = useState<string | null>(null);
  const [isPresent, setIsPresent] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [report, setReport] = useState('');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState([{ name: '', dosage: '', duration: '', instructions: '' }]);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpSlot, setFollowUpSlot] = useState('');

  // Patient history search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientConsultations, setPatientConsultations] = useState<Consultation[]>([]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadData = useCallback(async () => {
    if (!user) return;
    const uid = user.id;
    setIsLoading(true);
    try {
      const [aptsData, consData, usersData, patsData] = await Promise.all([
        api.getAppointments({ doctorId: uid }),
        api.getConsultations({ doctorId: uid }),
        api.getUsers(),
        api.getPatients()
      ]);
      setAppointments(aptsData.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.timeSlot.start.localeCompare(b.timeSlot.start);
      }));
      setAllConsultations(consData);
      setAllUsers(usersData);
      setPatients(patsData);
    } catch (err) {
      console.error('Failed to load doctor data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData, view]);

  const uid = user?.id || '';

  // Fetch follow-up slots
  useEffect(() => {
    if (uid && followUpDate) {
      api.getAvailableSlots(uid, followUpDate).then(setAvailableSlots);
    } else {
      setAvailableSlots([]);
    }
  }, [uid, followUpDate]);

  // Fetch specific patient history
  useEffect(() => {
    if (selectedPatientId) {
      api.getConsultations({ patientId: selectedPatientId }).then(setPatientConsultations);
    } else {
      setPatientConsultations([]);
    }
  }, [selectedPatientId]);

  if (!user) return null;

  const todayApts = appointments.filter(a => a.date === today && a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'no-show');
  const futureApts = appointments.filter(a => a.date >= today && a.status !== 'cancelled');

  function addMedication() {
    setMedications([...medications, { name: '', dosage: '', duration: '', instructions: '' }]);
  }

  function removeMedication(index: number) {
    setMedications(medications.filter((_, i) => i !== index));
  }

  function updateMedication(index: number, field: string, value: string) {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  }

  const startTreatment = useCallback((aptId: string) => {
    setTreatingAptId(aptId);
    setIsPresent(true); setDiagnosis(''); setReport(''); setNotes('');
    setMedications([{ name: '', dosage: '', duration: '', instructions: '' }]);
    setShowFollowUp(false); setFollowUpDate(''); setFollowUpSlot('');
    setError(''); setSuccess('');
    onNavigate('treat');
  }, [onNavigate]);

  async function handleSaveConsultation(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!treatingAptId) return;
    if (diagnosis.trim() === '' && isPresent) { setError('Le diagnostic est obligatoire.'); return; }
    if (report.trim() === '' && isPresent) { setError('Le compte-rendu est obligatoire.'); return; }

    const apt = appointments.find(a => a.id === treatingAptId);
    if (!apt) return;

    try {
      const validMeds = medications.filter(m => m.name.trim() !== '');
      await api.createConsultation({
        appointmentId: treatingAptId,
        patientId: apt.patientId,
        doctorId: uid,
        date: today,
        isPresent,
        report: isPresent ? report : 'Patient absent.',
        diagnosis: isPresent ? diagnosis : 'Absence',
        prescription: isPresent ? validMeds : [],
        notes,
      });

      if (showFollowUp && followUpDate && followUpSlot) {
        const freshSlots = await api.getAvailableSlots(uid, followUpDate);
        const slot = freshSlots.find(s => s.start === followUpSlot);
        if (slot) {
          await api.createAppointment({
            patientId: apt.patientId,
            doctorId: uid,
            date: followUpDate,
            timeSlot: slot,
            status: 'pending',
            reason: `Suivi: ${diagnosis}`,
          });
        }
      }

      setSuccess('Consultation enregistrée.');
      setTreatingAptId(null);
      loadData();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement.');
    }
  }

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.firstName.toLowerCase().includes(q) || 
      p.lastName.toLowerCase().includes(q) || 
      p.email.toLowerCase().includes(q) || 
      p.phone.includes(q)
    );
  }, [patients, searchQuery]);

  const selectedPatient = useMemo(() => 
    allUsers.find(u => u.id === selectedPatientId), 
    [allUsers, selectedPatientId]
  );

  function getUserName(id: string) {
    const u = allUsers.find(user => user.id === id);
    return u ? `${u.firstName} ${u.lastName}` : 'Inconnu';
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div></div>;
  }

  // ---- DASHBOARD ----
  if (view === 'dashboard') {
    return (
      <div className="space-y-6">
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center justify-between">
            {success}
            <button onClick={() => setSuccess('')}><X size={16} /></button>
          </div>
        )}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold">Bonjour, Dr. {user.firstName} !</h2>
          <p className="mt-1 text-teal-100">{todayApts.length} consultation(s) aujourd'hui</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Calendar size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayApts.length}</p>
                <p className="text-sm text-gray-500">RDV aujourd'hui</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{futureApts.filter(a => a.status === 'pending').length}</p>
                <p className="text-sm text-gray-500">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{allConsultations.length}</p>
                <p className="text-sm text-gray-500">Consultations</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Consultations du jour</h3>
          <div className="space-y-3">
            {todayApts.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-teal-50 rounded-lg px-3 py-2 min-w-[60px]">
                    <p className="text-lg font-bold text-teal-700">{apt.timeSlot.start}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{getUserName(apt.patientId)}</p>
                    <p className="text-xs text-gray-400 italic">{apt.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusLabels[apt.status].color}`}>
                    {statusLabels[apt.status].label}
                  </span>
                  <button onClick={() => startTreatment(apt.id)} className="flex items-center gap-1 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-teal-700 shadow-sm transition-colors">
                    <ClipboardList size={16} /> Traiter
                  </button>
                </div>
              </div>
            ))}
            {todayApts.length === 0 && <p className="text-gray-400 text-center py-8">Aucune consultation aujourd'hui</p>}
          </div>
        </div>
      </div>
    );
  }

  // ---- PLANNING ----
  if (view === 'planning') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Mon planning</h3>
        <div className="space-y-3">
          {futureApts.map(apt => (
            <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="text-center bg-gray-50 rounded-lg px-3 py-2 min-w-[60px]">
                  <p className="text-xs text-gray-500 font-bold">{new Date(apt.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                  <p className="text-lg font-bold text-gray-700">{new Date(apt.date).getDate()}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{getUserName(apt.patientId)}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14} /> {apt.timeSlot.start} - {apt.timeSlot.end}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusLabels[apt.status].color}`}>
                  {statusLabels[apt.status].label}
                </span>
                {apt.date <= today && (
                  <button onClick={() => startTreatment(apt.id)} className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-teal-700 transition-colors">
                    Traiter
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- TREAT VIEW ----
  if (view === 'treat' && treatingAptId) {
    const apt = appointments.find(a => a.id === treatingAptId);
    if (!apt) return null;
    const pat = allUsers.find(u => u.id === apt.patientId);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setTreatingAptId(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={20} className="text-gray-400 rotate-180" /></button>
          <h3 className="text-xl font-bold text-gray-900">Traitement du rendez-vous</h3>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
          <p className="font-bold text-blue-900">{getUserName(apt.patientId)}</p>
          <p className="text-sm text-blue-700">{apt.reason} — <span className="font-bold">{apt.timeSlot.start}</span></p>
          {pat && 'allergies' in pat && Array.isArray((pat as any).allergies) && (pat as any).allergies.length > 0 && (
            <p className="text-sm text-red-600 mt-2 font-bold uppercase text-[10px] tracking-wider">⚠️ Allergies : {(pat as any).allergies.join(', ')}</p>
          )}
        </div>

        <form onSubmit={handleSaveConsultation} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">Présence du patient</h4>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${isPresent ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>
                <input type="radio" checked={isPresent} onChange={() => setIsPresent(true)} className="sr-only" />
                <UserCheck size={20} /> Présent
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${!isPresent ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>
                <input type="radio" checked={!isPresent} onChange={() => setIsPresent(false)} className="sr-only" />
                <UserX size={20} /> Absent
              </label>
            </div>
          </div>

          {isPresent && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
                <h4 className="font-bold text-gray-900 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Dossier médical</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Diagnostic *</label>
                  <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Ex: Grippe, Lombalgie..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Compte-rendu *</label>
                  <textarea value={report} onChange={e => setReport(e.target.value)} required rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" placeholder="Observations cliniques..." />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2"><Pill size={20} className="text-purple-600" /> Ordonnance</h4>
                  <button type="button" onClick={addMedication} className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"><Plus size={14} /> Ajouter</button>
                </div>
                {medications.map((med, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100 relative group">
                    <button type="button" onClick={() => removeMedication(i)} className="absolute top-2 right-2 text-red-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Médicament *" value={med.name} onChange={e => updateMedication(i, 'name', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                      <input type="text" placeholder="Dosage" value={med.dosage} onChange={e => updateMedication(i, 'dosage', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Durée" value={med.duration} onChange={e => updateMedication(i, 'duration', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                      <input type="text" placeholder="Instructions" value={med.instructions} onChange={e => updateMedication(i, 'instructions', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2"><CalendarPlus size={20} className="text-orange-600" /> Suivi</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showFollowUp} onChange={e => setShowFollowUp(e.target.checked)} className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500" />
                    <span className="text-sm font-bold text-gray-600 uppercase text-[10px]">Planifier suivi</span>
                  </label>
                </div>
                {showFollowUp && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} min={today} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                    <select value={followUpSlot} onChange={e => setFollowUpSlot(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="">Choisir un créneau</option>
                      {availableSlots.map(s => <option key={s.start} value={s.start}>{s.start}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          <button type="submit" className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all flex items-center justify-center gap-2">
            <Save size={24} /> Enregistrer la consultation
          </button>
        </form>
      </div>
    );
  }

  // ---- PATIENT HISTORY ----
  if (view === 'patient-history') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Dossiers patients</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSelectedPatientId(null); }} placeholder="Nom, email, téléphone..." className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          {searchResults.length > 0 && !selectedPatientId && (
            <div className="mt-4 border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-sm max-h-64 overflow-auto">
              {searchResults.map(p => (
                <button key={p.id} onClick={() => setSelectedPatientId(p.id)} className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">{p.firstName[0]}{p.lastName[0]}</div>
                  <div>
                    <p className="font-bold text-gray-900">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPatient && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</h4>
                <p className="text-sm text-gray-500">{selectedPatient.email} — {selectedPatient.phone}</p>
                {'dateOfBirth' in selectedPatient && <p className="text-xs font-bold text-gray-400 mt-2 uppercase">Né(e) le {new Date((selectedPatient as any).dateOfBirth).toLocaleDateString('fr-FR')}</p>}
              </div>
              <button onClick={() => { setSelectedPatientId(null); setSearchQuery(''); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2"><Activity size={20} className="text-green-600" /> Consultations passées</h4>
              {patientConsultations.map(cons => (
                <div key={cons.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-900">{new Date(cons.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cons.isPresent ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{cons.isPresent ? 'Présent' : 'Absent'}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Diagnostic</p>
                    <p className="text-sm font-bold text-gray-800">{cons.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Rapport</p>
                    <p className="text-sm text-gray-600">{cons.report}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
