// ============================================================
// Domain Types — Cabinet Médical
// ============================================================

export type UserRole = 'admin' | 'patient' | 'secretary' | 'doctor';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  address: string;
  bloodType: string;
  allergies: string[];
}

export interface Doctor extends User {
  role: 'doctor';
  specialization: string;
}

export interface Secretary extends User {
  role: 'secretary';
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;        // YYYY-MM-DD
  timeSlot: TimeSlot;
  status: AppointmentStatus;
  reason: string;
  createdAt: string;
  consultationId?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  date: string;
  isPresent: boolean;
  report: string;
  diagnosis: string;
  prescription: Medication[];
  notes: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type AppUser = Patient | Doctor | Secretary | User;
