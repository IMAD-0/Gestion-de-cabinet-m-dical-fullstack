// ============================================================
// Simple Async Logger — Non-blocking, basic levels
// ============================================================

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

const LOG_KEY = 'cabinet_logs';
const MAX_LOGS = 200;

function getLogs(): LogEntry[] {
  const raw = localStorage.getItem(LOG_KEY);
  return raw ? JSON.parse(raw) : [];
}

function persistLog(entry: LogEntry): void {
  const logs = getLogs();
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function createLog(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };
  // Async write — use queueMicrotask for non-blocking
  queueMicrotask(() => persistLog(entry));

  // Also console output in dev
  const style = level === 'ERROR' ? 'color: red' : level === 'WARN' ? 'color: orange' : 'color: gray';
  console.log(`%c[${level}] ${entry.timestamp} — ${message}`, style);
}

export const logger = {
  info: (msg: string, data?: unknown) => createLog('INFO', msg, data),
  warn: (msg: string, data?: unknown) => createLog('WARN', msg, data),
  error: (msg: string, data?: unknown) => createLog('ERROR', msg, data),
  getLogs,
};
