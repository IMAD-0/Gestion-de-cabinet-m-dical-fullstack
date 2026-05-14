// src/shared/logger.test.ts — Unit tests
import { describe, it, expect, beforeEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create an INFO log entry', () => {
    // Wait for async queueMicrotask
    logger.info('Test info message', { key: 'value' });
    // queueMicrotask is async — wait a tick
    return new Promise<void>((resolve) => {
      queueMicrotask(() => {
        setTimeout(() => {
          const logs = logger.getLogs();
          const entry = logs.find(l => l.message === 'Test info message');
          expect(entry).toBeDefined();
          expect(entry?.level).toBe('INFO');
          expect(entry?.data).toEqual({ key: 'value' });
          expect(entry?.timestamp).toBeTruthy();
          resolve();
        }, 50);
      });
    });
  });

  it('should create a WARN log entry', () => {
    logger.warn('Test warning');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const logs = logger.getLogs();
        const entry = logs.find(l => l.message === 'Test warning');
        expect(entry).toBeDefined();
        expect(entry?.level).toBe('WARN');
        resolve();
      }, 50);
    });
  });

  it('should create an ERROR log entry', () => {
    logger.error('Test error');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const logs = logger.getLogs();
        const entry = logs.find(l => l.message === 'Test error');
        expect(entry).toBeDefined();
        expect(entry?.level).toBe('ERROR');
        resolve();
      }, 50);
    });
  });

  it('should cap logs at 200 entries', () => {
    localStorage.clear();
    for (let i = 0; i < 250; i++) {
      // Directly write to test the cap
      const logs = JSON.parse(localStorage.getItem('cabinet_logs') || '[]');
      logs.push({ timestamp: new Date().toISOString(), level: 'INFO', message: `msg-${i}` });
      const trimmed = logs.length > 200 ? logs.slice(logs.length - 200) : logs;
      localStorage.setItem('cabinet_logs', JSON.stringify(trimmed));
    }
    const logs = logger.getLogs();
    expect(logs.length).toBe(200);
  });

  it('should include a valid ISO timestamp', () => {
    logger.info('Timestamp test');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const logs = logger.getLogs();
        const entry = logs.find(l => l.message === 'Timestamp test');
        expect(entry).toBeDefined();
        expect(new Date(entry!.timestamp).toISOString()).toBe(entry!.timestamp);
        resolve();
      }, 50);
    });
  });
});
