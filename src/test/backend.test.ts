// src/test/backend.test.ts — Backend route unit tests (pure logic)
import { describe, it, expect } from 'vitest';

// ══════════════════════════════════════
// Test the toCamel helper logic
// ══════════════════════════════════════

function toCamel(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

function safeUser(user: Record<string, unknown>) {
  const { passwordHash, ...safe } = user;
  return safe;
}

describe('Backend — toCamel helper', () => {
  it('converts snake_case to camelCase', () => {
    const row = {
      first_name: 'Ahmed',
      last_name: 'Benali',
      password_hash: 'hashed',
      date_of_birth: '1985-03-15',
      blood_type: 'A+',
      created_at: '2025-01-01',
    };
    const result = toCamel(row);
    expect(result.firstName).toBe('Ahmed');
    expect(result.lastName).toBe('Benali');
    expect(result.passwordHash).toBe('hashed');
    expect(result.dateOfBirth).toBe('1985-03-15');
    expect(result.bloodType).toBe('A+');
    expect(result.createdAt).toBe('2025-01-01');
  });

  it('handles already camelCase keys', () => {
    const row = { firstName: 'Test', lastName: 'User' };
    const result = toCamel(row);
    expect(result.firstName).toBe('Test');
    expect(result.lastName).toBe('User');
  });

  it('handles empty object', () => {
    const result = toCamel({});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('handles multiple consecutive underscores', () => {
    const row = { user__name: 'test' };
    const result = toCamel(row);
    // Second underscore followed by 'n' → 'N'
    expect(result.user_Name).toBe('test');
  });

  it('preserves non-snake values', () => {
    const row = { email: 'test@test.com', role: 'patient', id: '123' };
    const result = toCamel(row);
    expect(result.email).toBe('test@test.com');
    expect(result.role).toBe('patient');
    expect(result.id).toBe('123');
  });
});

describe('Backend — safeUser helper', () => {
  it('strips passwordHash from user object', () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      passwordHash: 'secret-hash',
      firstName: 'Test',
      role: 'patient',
    };
    const result = safeUser(user);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.id).toBe('1');
    expect(result.email).toBe('test@test.com');
    expect(result.firstName).toBe('Test');
  });

  it('returns all fields when no passwordHash', () => {
    const user = { id: '1', email: 'test@test.com', firstName: 'Test' };
    const result = safeUser(user);
    expect(Object.keys(result)).toHaveLength(3);
  });

  it('handles empty object', () => {
    const result = safeUser({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ══════════════════════════════════════
// Test appointment slot calculation logic
// ══════════════════════════════════════

describe('Appointment — available slots calculation', () => {
  const allSlots = [
    { start: '08:00', end: '08:30' }, { start: '08:30', end: '09:00' },
    { start: '09:00', end: '09:30' }, { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' }, { start: '10:30', end: '11:00' },
    { start: '11:00', end: '11:30' }, { start: '11:30', end: '12:00' },
    { start: '14:00', end: '14:30' }, { start: '14:30', end: '15:00' },
    { start: '15:00', end: '15:30' }, { start: '15:30', end: '16:00' },
    { start: '16:00', end: '16:30' }, { start: '16:30', end: '17:00' },
  ];

  function getAvailableSlots(bookedStarts: string[]) {
    const booked = new Set(bookedStarts);
    return allSlots.filter(s => !booked.has(s.start));
  }

  it('returns all 14 slots when nothing booked', () => {
    expect(getAvailableSlots([])).toHaveLength(14);
  });

  it('excludes booked slots', () => {
    const available = getAvailableSlots(['09:00', '14:00']);
    expect(available).toHaveLength(12);
    expect(available.find(s => s.start === '09:00')).toBeUndefined();
    expect(available.find(s => s.start === '14:00')).toBeUndefined();
    expect(available.find(s => s.start === '08:00')).toBeDefined();
  });

  it('returns empty when all slots booked', () => {
    const bookedStarts = allSlots.map(s => s.start);
    expect(getAvailableSlots(bookedStarts)).toHaveLength(0);
  });

  it('each slot has 30-minute duration', () => {
    allSlots.forEach(slot => {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      const durationMin = (eh * 60 + em) - (sh * 60 + sm);
      expect(durationMin).toBe(30);
    });
  });

  it('morning slots end at 12:00', () => {
    const morning = allSlots.filter(s => parseInt(s.start) < 12);
    expect(morning).toHaveLength(8);
    expect(morning[morning.length - 1].end).toBe('12:00');
  });

  it('afternoon slots start at 14:00', () => {
    const afternoon = allSlots.filter(s => parseInt(s.start) >= 14);
    expect(afternoon).toHaveLength(6);
    expect(afternoon[0].start).toBe('14:00');
  });
});

// ══════════════════════════════════════
// Test status transitions
// ══════════════════════════════════════

describe('Appointment — status transitions', () => {
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'] as const;

  type Status = typeof validStatuses[number];

  const transitions: Record<Status, Status[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'no-show'],
    completed: [],
    cancelled: [],
    'no-show': [],
  };

  it('pending can transition to confirmed', () => {
    expect(transitions.pending).toContain('confirmed');
  });

  it('pending can transition to cancelled', () => {
    expect(transitions.pending).toContain('cancelled');
  });

  it('confirmed can transition to completed', () => {
    expect(transitions.confirmed).toContain('completed');
  });

  it('completed is a terminal state', () => {
    expect(transitions.completed).toHaveLength(0);
  });

  it('cancelled is a terminal state', () => {
    expect(transitions.cancelled).toHaveLength(0);
  });

  it('no-show is a terminal state', () => {
    expect(transitions['no-show']).toHaveLength(0);
  });

  it('all statuses are accounted for', () => {
    expect(validStatuses).toHaveLength(5);
  });
});

// ══════════════════════════════════════
// Test role-based access matrix
// ══════════════════════════════════════

describe('Access Control — role permissions', () => {
  const roles = ['admin', 'doctor', 'secretary', 'patient'] as const;
  type Role = typeof roles[number];

  const permissions: Record<Role, string[]> = {
    admin: ['manage-staff', 'view-dashboard'],
    doctor: ['treat-appointment', 'view-planning', 'view-patient-history', 'write-prescription'],
    secretary: ['manage-patients', 'manage-appointments', 'view-planning'],
    patient: ['manage-own-appointments', 'view-own-history'],
  };

  it('admin can manage staff', () => {
    expect(permissions.admin).toContain('manage-staff');
  });

  it('admin cannot treat appointments', () => {
    expect(permissions.admin).not.toContain('treat-appointment');
  });

  it('doctor can treat appointments and write prescriptions', () => {
    expect(permissions.doctor).toContain('treat-appointment');
    expect(permissions.doctor).toContain('write-prescription');
  });

  it('secretary can manage patients', () => {
    expect(permissions.secretary).toContain('manage-patients');
  });

  it('patient can only manage own data', () => {
    permissions.patient.forEach(p => {
      expect(p).toMatch(/^manage-own|^view-own/);
    });
  });

  it('no role has all permissions', () => {
    const allPerms = new Set(Object.values(permissions).flat());
    roles.forEach(role => {
      expect(permissions[role].length).toBeLessThan(allPerms.size);
    });
  });
});
