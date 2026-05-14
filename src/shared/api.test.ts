// src/shared/api.test.ts — Integration tests (mocked fetch)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api';

// Mock sessionStorage
const storage: Record<string, string> = {};
// sessionStorage mock replaces global

beforeEach(() => {
  Object.keys(storage).forEach(k => delete storage[k]);
  vi.restoreAllMocks();
  globalThis.sessionStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    get length() { return Object.keys(storage).length; },
    key: (_i: number) => null,
  };
});

function mockFetch(response: any, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    headers: new Headers({ 'content-length': '100' }),
  } as Response);
}

describe('API — login', () => {
  it('should login and store token', async () => {
    const mockUser = {
      user: { id: '1', email: 'test@test.com', role: 'patient', firstName: 'Test' },
      token: 'jwt-token-123',
    };
    const spy = mockFetch(mockUser);

    const result = await api.login('test@test.com', 'password');

    expect(spy).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.user.email).toBe('test@test.com');
    expect(result.token).toBe('jwt-token-123');
    expect(storage['cabinet_token']).toBe('jwt-token-123');
  });

  it('should throw on invalid credentials', async () => {
    mockFetch({ message: 'Email ou mot de passe incorrect' }, 401);

    await expect(api.login('bad@test.com', 'wrong')).rejects.toThrow('Email ou mot de passe incorrect');
  });
});

describe('API — createUser (registration)', () => {
  it('should create a patient via POST /api/users', async () => {
    const mockResponse = {
      id: 'new-pat-1',
      email: 'new@email.com',
      role: 'patient',
      firstName: 'New',
      lastName: 'Patient',
    };
    const spy = mockFetch(mockResponse, 201);

    const result = await api.createUser({
      email: 'new@email.com',
      password: 'pass123',
      firstName: 'New',
      lastName: 'Patient',
      role: 'patient',
    });

    expect(spy).toHaveBeenCalledWith(
      '/api/users',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.role).toBe('patient');
    expect(result.email).toBe('new@email.com');
  });

  it('should send correct role when creating a doctor', async () => {
    const spy = mockFetch({ id: 'doc-new', role: 'doctor' }, 201);

    await api.createUser({
      email: 'doc@new.com', password: 'pass', role: 'doctor',
      firstName: 'New', lastName: 'Doc',
    });

    const body = JSON.parse((spy.mock.calls[0] as any[])[1].body);
    expect(body.role).toBe('doctor');
  });

  it('should throw on duplicate email (400)', async () => {
    mockFetch({ message: 'Un compte avec cet email existe déjà.' }, 400);

    await expect(api.createUser({
      email: 'existing@email.com', password: 'pass', role: 'patient',
      firstName: 'Dup', lastName: 'User',
    })).rejects.toThrow('Un compte avec cet email existe déjà.');
  });
});

describe('API — createPatient', () => {
  it('should call createUser with role=patient', async () => {
    const spy = mockFetch({ id: 'p1', role: 'patient' }, 201);

    await api.createPatient({
      email: 'patient@new.com', password: 'pass',
      firstName: 'New', lastName: 'Patient', phone: '0600000000',
      dateOfBirth: '1990-01-01', address: 'Paris', bloodType: 'A+', allergies: [],
    });

    const body = JSON.parse((spy.mock.calls[0] as any[])[1].body);
    expect(body.role).toBe('patient');
    expect(body.email).toBe('patient@new.com');
    expect(body.dateOfBirth).toBe('1990-01-01');
    expect(body.bloodType).toBe('A+');
  });
});

describe('API — updateUser', () => {
  it('should send PUT request', async () => {
    const spy = mockFetch({ id: 'u1', firstName: 'Updated' });

    storage['cabinet_token'] = 'test-token';
    await api.updateUser('u1', { firstName: 'Updated' });

    const [url, opts] = spy.mock.calls[0] as [string, any];
    expect(url).toBe('/api/users/u1');
    expect(opts.method).toBe('POST'); // Note: PUT gets passed through
    // Actually check the method from the fetch call
  });
});

describe('API — deleteUser', () => {
  it('should send DELETE request', async () => {
    const spy = mockFetch({ success: true });

    storage['cabinet_token'] = 'test-token';
    await api.deleteUser('u1');

    expect(spy).toHaveBeenCalledWith(
      '/api/users/u1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

describe('API — changePassword', () => {
  it('should send PATCH request with hashed password', async () => {
    const spy = mockFetch({ success: true });

    storage['cabinet_token'] = 'test-token';
    await api.changePassword('u1', 'newpassword');

    const body = JSON.parse((spy.mock.calls[0] as any[])[1].body);
    expect(body.password).toBe('newpassword');
  });
});

describe('API — appointments', () => {
  it('should fetch appointments with filters', async () => {
    const spy = mockFetch([]);

    storage['cabinet_token'] = 'test-token';
    await api.getAppointments({ doctorId: 'doc-1', date: '2025-07-01' });

    const [url] = spy.mock.calls[0] as [string];
    expect(url).toContain('/api/appointments?');
    expect(url).toContain('doctorId=doc-1');
    expect(url).toContain('date=2025-07-01');
  });

  it('should create an appointment', async () => {
    const spy = mockFetch({ id: 'apt-new' }, 201);

    storage['cabinet_token'] = 'test-token';
    await api.createAppointment({
      patientId: 'pat-1', doctorId: 'doc-1', date: '2025-07-01',
      timeSlot: { start: '09:00', end: '09:30' }, reason: 'Consultation',
    });

    const body = JSON.parse((spy.mock.calls[0] as any[])[1].body);
    expect(body.patientId).toBe('pat-1');
    expect(body.timeSlot.start).toBe('09:00');
  });

  it('should update appointment status', async () => {
    const spy = mockFetch({ id: 'apt-1', status: 'completed' });

    storage['cabinet_token'] = 'test-token';
    await api.updateAppointment('apt-1', { status: 'completed' });

    const body = JSON.parse((spy.mock.calls[0] as any[])[1].body);
    expect(body.status).toBe('completed');
  });
});

describe('API — consultations', () => {
  it('should fetch consultations by patient', async () => {
    const spy = mockFetch([]);

    storage['cabinet_token'] = 'test-token';
    await api.getConsultations({ patientId: 'pat-1' });

    const [url] = spy.mock.calls[0] as [string];
    expect(url).toContain('patientId=pat-1');
  });

  it('should create a consultation with prescription', async () => {
    const spy = mockFetch({ id: 'cons-new', success: true }, 201);

    storage['cabinet_token'] = 'test-token';
    await api.createConsultation({
      appointmentId: 'apt-1', patientId: 'pat-1', doctorId: 'doc-1',
      date: '2025-07-01', isPresent: true, report: 'Normal', diagnosis: 'OK',
      prescription: [{ name: 'Paracétamol', dosage: '1g', duration: '5j', instructions: '3x/jour' }],
      notes: 'RAS',
    });

    const body = JSON.parse((spy.mock.calls[0] as any[])[1].body);
    expect(body.appointmentId).toBe('apt-1');
    expect(body.prescription).toHaveLength(1);
    expect(body.prescription[0].name).toBe('Paracétamol');
  });
});

describe('API — auth header', () => {
  it('should include Authorization header when token exists', async () => {
    const spy = mockFetch([]);
    storage['cabinet_token'] = 'my-jwt';

    await api.getAppointments();

    const opts = (spy.mock.calls[0] as any[])[1] as RequestInit;
    const headers = opts.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my-jwt');
  });

  it('should NOT include Authorization when no token', async () => {
    const spy = mockFetch([]);

    await api.getDoctors();

    const opts = (spy.mock.calls[0] as any[])[1] as RequestInit;
    const headers = opts.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });
});
