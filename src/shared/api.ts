// ============================================================
// API Layer — REST Client for Express/MySQL Backend
// All data flows through MySQL via Express API. No LocalStorage.
// ============================================================

import type { AppUser, Appointment, Consultation, Doctor, Patient } from './types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('cabinet_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `Erreur réseau (${response.status})` }));
    throw new Error(err.message || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return response.json();
}

export const api = {
  // ══════════ AUTH ══════════
  async login(email: string, password: string): Promise<{ user: AppUser; token: string }> {
    const result = await request<{ user: AppUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    sessionStorage.setItem('cabinet_token', result.token);
    return result;
  },

  logout(): void {
    sessionStorage.removeItem('cabinet_token');
  },

  // ══════════ USERS ══════════
  async getUsers(role?: string): Promise<AppUser[]> {
    const query = role ? `?role=${role}` : '';
    return request<AppUser[]>(`/users${query}`);
  },

  async getUserById(id: string): Promise<AppUser> {
    return request<AppUser>(`/users/${id}`);
  },

  async getPatients(): Promise<Patient[]> {
    return request<Patient[]>('/users?role=patient');
  },

  async getDoctors(): Promise<Doctor[]> {
    return request<Doctor[]>('/users?role=doctor');
  },

  async getUsersByRole(role: string): Promise<AppUser[]> {
    return request<AppUser[]>(`/users?role=${role}`);
  },

  // POST /api/users — works for ALL roles (patient registration, admin creates doctor/secretary)
  async createUser(data: Record<string, unknown>): Promise<AppUser> {
    return request<AppUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Alias for patient registration
  async createPatient(data: Record<string, unknown>): Promise<AppUser> {
    return this.createUser({ ...data, role: 'patient' });
  },

  async updateUser(id: string, data: Record<string, unknown>): Promise<AppUser> {
    return request<AppUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(id: string, password: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' });
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<{ start: string; end: string }[]> {
    return request<{ start: string; end: string }[]>(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
  },

  // ══════════ APPOINTMENTS ══════════
  async getAppointments(filters?: Record<string, string>): Promise<Appointment[]> {
    if (filters) {
      const params = new URLSearchParams(filters);
      return request<Appointment[]>(`/appointments?${params.toString()}`);
    }
    return request<Appointment[]>('/appointments');
  },

  async createAppointment(data: Record<string, unknown>): Promise<Appointment> {
    return request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAppointment(id: string, data: Record<string, unknown>): Promise<Appointment> {
    return request<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAppointment(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/appointments/${id}`, { method: 'DELETE' });
  },

  async cancelAppointment(id: string): Promise<Appointment> {
    return request<Appointment>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  // ══════════ CONSULTATIONS ══════════
  async getConsultations(filters?: Record<string, string>): Promise<Consultation[]> {
    if (filters) {
      const params = new URLSearchParams(filters);
      return request<Consultation[]>(`/consultations?${params.toString()}`);
    }
    return request<Consultation[]>('/consultations');
  },

  async createConsultation(data: Record<string, unknown>): Promise<{ id: string; success: boolean }> {
    return request<{ id: string; success: boolean }>('/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
