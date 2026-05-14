// ============================================================
// Data Store — LocalStorage persistence (simulating MySQL)
// ============================================================

import type { AppUser, Patient, Doctor, Secretary, Appointment, Consultation, User } from './types';

const USERS_KEY = 'cabinet_users';
const APPOINTMENTS_KEY = 'cabinet_appointments';
const CONSULTATIONS_KEY = 'cabinet_consultations';

// ---------- Seed Data ----------

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function seedData(): void {
  if (localStorage.getItem(USERS_KEY)) return;

  const admin: User = {
    id: 'admin-1',
    email: 'admin@cabinet.fr',
    password: 'admin123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Système',
    phone: '0600000000',
    createdAt: '2025-01-01T00:00:00Z',
  };

  const doctor1: Doctor = {
    id: 'doc-1',
    email: 'dupont@cabinet.fr',
    password: 'doctor123',
    role: 'doctor',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '0612345678',
    createdAt: '2025-01-01T00:00:00Z',
    specialization: 'Médecine Générale',
  };

  const doctor2: Doctor = {
    id: 'doc-2',
    email: 'martin@cabinet.fr',
    password: 'doctor123',
    role: 'doctor',
    firstName: 'Claire',
    lastName: 'Martin',
    phone: '0623456789',
    createdAt: '2025-01-15T00:00:00Z',
    specialization: 'Médecine Générale',
  };

  const secretary: Secretary = {
    id: 'sec-1',
    email: 'marie@cabinet.fr',
    password: 'secret123',
    role: 'secretary',
    firstName: 'Marie',
    lastName: 'Laurent',
    phone: '0634567890',
    createdAt: '2025-01-01T00:00:00Z',
  };

  const patient1: Patient = {
    id: 'pat-1',
    email: 'ahmed@email.com',
    password: 'patient123',
    role: 'patient',
    firstName: 'Ahmed',
    lastName: 'Benali',
    phone: '0645678901',
    createdAt: '2025-02-01T00:00:00Z',
    dateOfBirth: '1985-03-15',
    address: '12 Rue des Lilas, 75011 Paris',
    bloodType: 'A+',
    allergies: ['Pénicilline'],
  };

  const patient2: Patient = {
    id: 'pat-2',
    email: 'sophie@email.com',
    password: 'patient123',
    role: 'patient',
    firstName: 'Sophie',
    lastName: 'Dubois',
    phone: '0656789012',
    createdAt: '2025-02-15T00:00:00Z',
    dateOfBirth: '1990-07-22',
    address: '8 Avenue Victor Hugo, 75016 Paris',
    bloodType: 'O-',
    allergies: [],
  };

  const patient3: Patient = {
    id: 'pat-3',
    email: 'karim@email.com',
    password: 'patient123',
    role: 'patient',
    firstName: 'Karim',
    lastName: 'Hassan',
    phone: '0667890123',
    createdAt: '2025-03-01T00:00:00Z',
    dateOfBirth: '1978-11-30',
    address: '45 Boulevard Haussmann, 75009 Paris',
    bloodType: 'B+',
    allergies: ['Aspirine', 'Sulfamides'],
  };

  const users: AppUser[] = [admin, doctor1, doctor2, secretary, patient1, patient2, patient3];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Sample appointments
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const appointments: Appointment[] = [
    {
      id: 'apt-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      date: today,
      timeSlot: { start: '09:00', end: '09:30' },
      status: 'confirmed',
      reason: 'Douleur au dos',
      createdAt: '2025-06-01T10:00:00Z',
    },
    {
      id: 'apt-2',
      patientId: 'pat-2',
      doctorId: 'doc-1',
      date: today,
      timeSlot: { start: '09:30', end: '10:00' },
      status: 'pending',
      reason: 'Consultation annuelle',
      createdAt: '2025-06-02T14:00:00Z',
    },
    {
      id: 'apt-3',
      patientId: 'pat-3',
      doctorId: 'doc-2',
      date: today,
      timeSlot: { start: '10:00', end: '10:30' },
      status: 'confirmed',
      reason: 'Suivi hypertension',
      createdAt: '2025-06-03T09:00:00Z',
    },
    {
      id: 'apt-4',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      date: tomorrow,
      timeSlot: { start: '14:00', end: '14:30' },
      status: 'pending',
      reason: 'Renouvellement ordonnance',
      createdAt: '2025-06-04T11:00:00Z',
    },
    {
      id: 'apt-5',
      patientId: 'pat-2',
      doctorId: 'doc-2',
      date: tomorrow,
      timeSlot: { start: '11:00', end: '11:30' },
      status: 'cancelled',
      reason: 'Fièvre',
      createdAt: '2025-06-05T08:00:00Z',
    },
  ];
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));

  // Sample completed consultation
  const consultations: Consultation[] = [
    {
      id: 'cons-1',
      appointmentId: 'apt-old-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      date: '2025-05-15',
      isPresent: true,
      report: 'Patient présentant des douleurs lombaires depuis 2 semaines. Examen clinique normal.',
      diagnosis: 'Lombalgie commune',
      prescription: [
        { name: 'Paracétamol', dosage: '1g', duration: '7 jours', instructions: '3 fois par jour si douleur' },
        { name: 'Myorelaxant', dosage: '4mg', duration: '5 jours', instructions: '1 comprimé le soir' },
      ],
      notes: 'Repos recommandé. Revoir si pas d\'amélioration sous 2 semaines.',
    },
    {
      id: 'cons-2',
      appointmentId: 'apt-old-2',
      patientId: 'pat-3',
      doctorId: 'doc-2',
      date: '2025-05-20',
      isPresent: true,
      report: 'Contrôle tension artérielle. PA: 14/8. Bon équilibre sous traitement.',
      diagnosis: 'HTA contrôlée',
      prescription: [
        { name: 'Amlodipine', dosage: '5mg', duration: '3 mois', instructions: '1 comprimé par jour' },
      ],
      notes: 'Continuer le traitement actuel. Prochain contrôle dans 3 mois.',
    },
  ];
  localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(consultations));
}

// ---------- Generic CRUD ----------

function getCollection<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setCollection<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---------- User CRUD ----------

export function getUsers(): AppUser[] {
  return getCollection<AppUser>(USERS_KEY);
}

export function getUserById(id: string): AppUser | undefined {
  return getUsers().find(u => u.id === id);
}

export function getUserByEmail(email: string): AppUser | undefined {
  return getUsers().find(u => u.email === email);
}

export function authenticate(email: string, password: string): AppUser | null {
  const user = getUsers().find(u => u.email === email && u.password === password);
  return user ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createUser(user: Record<string, any>): AppUser {
  const users = getUsers();
  if (users.find(u => u.email === user.email)) {
    throw new Error('Un compte avec cet email existe déjà.');
  }
  const newUser = { ...user, id: generateId(), createdAt: new Date().toISOString() } as AppUser;
  users.push(newUser);
  setCollection(USERS_KEY, users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<AppUser>): AppUser | null {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates, id: users[idx].id, createdAt: users[idx].createdAt } as AppUser;
  setCollection(USERS_KEY, users);
  return users[idx];
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  setCollection(USERS_KEY, filtered);
  return true;
}

export function getDoctors(): Doctor[] {
  return getUsers().filter((u): u is Doctor => u.role === 'doctor');
}

export function getSecretaries(): Secretary[] {
  return getUsers().filter((u): u is Secretary => u.role === 'secretary');
}

export function getPatients(): Patient[] {
  return getUsers().filter((u): u is Patient => u.role === 'patient');
}

export function searchPatients(query: string): Patient[] {
  const q = query.toLowerCase();
  return getPatients().filter(
    p =>
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q)
  );
}

// ---------- Appointment CRUD ----------

export function getAppointments(): Appointment[] {
  return getCollection<Appointment>(APPOINTMENTS_KEY);
}

export function getAppointmentById(id: string): Appointment | undefined {
  return getAppointments().find(a => a.id === id);
}

export function getAppointmentsByDoctor(doctorId: string): Appointment[] {
  return getAppointments().filter(a => a.doctorId === doctorId);
}

export function getAppointmentsByPatient(patientId: string): Appointment[] {
  return getAppointments().filter(a => a.patientId === patientId);
}

export function getAppointmentsByDate(date: string): Appointment[] {
  return getAppointments().filter(a => a.date === date);
}

export function getAvailableSlots(doctorId: string, date: string): { start: string; end: string }[] {
  const allSlots = [
    { start: '08:00', end: '08:30' },
    { start: '08:30', end: '09:00' },
    { start: '09:00', end: '09:30' },
    { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' },
    { start: '10:30', end: '11:00' },
    { start: '11:00', end: '11:30' },
    { start: '11:30', end: '12:00' },
    { start: '14:00', end: '14:30' },
    { start: '14:30', end: '15:00' },
    { start: '15:00', end: '15:30' },
    { start: '15:30', end: '16:00' },
    { start: '16:00', end: '16:30' },
    { start: '16:30', end: '17:00' },
  ];

  // Only actively booked appointments block a slot
  // cancelled = free, no-show = free (patient didn't come), completed = slot was used (still blocks to avoid confusion)
  const booked = getAppointments().filter(
    a => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled' && a.status !== 'no-show'
  );

  const bookedStarts = new Set(booked.map(a => a.timeSlot.start));
  return allSlots.filter(s => !bookedStarts.has(s.start));
}

export function createAppointment(apt: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
  const appointments = getAppointments();
  const newApt = { ...apt, id: generateId(), createdAt: new Date().toISOString() };
  appointments.push(newApt);
  setCollection(APPOINTMENTS_KEY, appointments);
  return newApt;
}

export function updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return null;
  appointments[idx] = { ...appointments[idx], ...updates, id: appointments[idx].id };
  setCollection(APPOINTMENTS_KEY, appointments);
  return appointments[idx];
}

export function deleteAppointment(id: string): boolean {
  const appointments = getAppointments();
  const filtered = appointments.filter(a => a.id !== id);
  if (filtered.length === appointments.length) return false;
  setCollection(APPOINTMENTS_KEY, filtered);
  return true;
}

// ---------- Consultation CRUD ----------

export function getConsultations(): Consultation[] {
  return getCollection<Consultation>(CONSULTATIONS_KEY);
}

export function getConsultationsByPatient(patientId: string): Consultation[] {
  return getConsultations().filter(c => c.patientId === patientId);
}

export function getConsultationsByDoctor(doctorId: string): Consultation[] {
  return getConsultations().filter(c => c.doctorId === doctorId);
}

export function createConsultation(cons: Omit<Consultation, 'id'>): Consultation {
  const consultations = getConsultations();
  const newCons = { ...cons, id: generateId() };
  consultations.push(newCons);
  setCollection(CONSULTATIONS_KEY, consultations);
  return newCons;
}

// ---------- Init ----------

seedData();
