// ============================================================
// server/index.ts — Express Backend for Cabinet Médical
// All routes: auth, users, appointments, consultations
// MySQL with bcrypt passwords + JWT auth + camelCase mapping
// ============================================================

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './db';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'cabinet-secret-key-2025';

app.use(cors());
app.use(express.json());

// ── Helpers ──
// Convert snake_case MySQL row → camelCase for frontend
function toCamel(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

function toCamelList(rows: Record<string, unknown>[]) {
  return rows.map(toCamel);
}

// Strip password from user object
function safeUser(user: Record<string, unknown>) {
  const { passwordHash, password_hash, ...safe } = user as Record<string, unknown>;
  return safe;
}

// ── Auth Middleware ──
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    (req as any).user = decoded;
    next();
  });
}

// ══════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows]: any = await (pool as any).query(
      'SELECT u.*, pd.date_of_birth, pd.address, pd.blood_type, pd.allergies, dd.specialization ' +
      'FROM users u ' +
      'LEFT JOIN patient_details pd ON u.id = pd.user_id ' +
      'LEFT JOIN doctor_details dd ON u.id = dd.user_id ' +
      'WHERE u.email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const dbUser = rows[0];
    const validPassword = await bcrypt.compare(password, dbUser.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: dbUser.id, role: dbUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Map to camelCase and remove password
    const mapped = toCamel(dbUser);
    mapped.role = dbUser.role; // preserve enum value
    // Map time fields to strings
    if (mapped.dateOfBirth && mapped.dateOfBirth instanceof Date) {
      mapped.dateOfBirth = (mapped.dateOfBirth as Date).toISOString().split('T')[0];
    }
    if (typeof mapped.allergies === 'string') {
      try { mapped.allergies = JSON.parse(mapped.allergies); } catch { mapped.allergies = []; }
    }

    const user = safeUser(mapped);

    res.json({ token, user });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ══════════════════════════════════════
// USERS ROUTES
// ══════════════════════════════════════

// GET /api/users?role=patient|doctor|secretary|admin
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT u.*, pd.date_of_birth, pd.address, pd.blood_type, pd.allergies, dd.specialization ' +
              'FROM users u ' +
              'LEFT JOIN patient_details pd ON u.id = pd.user_id ' +
              'LEFT JOIN doctor_details dd ON u.id = dd.user_id';
    const params: any[] = [];

    if (req.query.role) {
      sql += ' WHERE u.role = ?';
      params.push(req.query.role);
    }

    const [rows]: any = await (pool as any).query(sql, params);
    const users = rows.map((r: any) => {
      const mapped = toCamel(r);
      if (typeof mapped.allergies === 'string') {
        try { mapped.allergies = JSON.parse(mapped.allergies); } catch { mapped.allergies = []; }
      }
      return safeUser(mapped);
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/:id
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const [rows]: any = await (pool as any).query(
      'SELECT u.*, pd.date_of_birth, pd.address, pd.blood_type, pd.allergies, dd.specialization ' +
      'FROM users u ' +
      'LEFT JOIN patient_details pd ON u.id = pd.user_id ' +
      'LEFT JOIN doctor_details dd ON u.id = dd.user_id ' +
      'WHERE u.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const mapped = toCamel(rows[0]);
    if (typeof mapped.allergies === 'string') {
      try { mapped.allergies = JSON.parse(mapped.allergies); } catch { mapped.allergies = []; }
    }
    res.json(safeUser(mapped));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users — Create any user (patient, doctor, secretary)
app.post('/api/users', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = randomUUID();
    const { email, password, firstName, lastName, phone, role = 'patient',
            dateOfBirth, address, bloodType, allergies, specialization } = req.body;

    // Check duplicate
    const [existing]: any = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Un compte avec cet email existe déjà.' });
    }

    const hash = await bcrypt.hash(password || 'changeme', 10);
    await conn.execute(
      'INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, email, hash, role, firstName, lastName, phone || '']
    );

    // Create detail records based on role
    if (role === 'patient') {
      await conn.execute(
        'INSERT INTO patient_details (user_id, date_of_birth, address, blood_type, allergies) VALUES (?, ?, ?, ?, ?)',
        [id, dateOfBirth || null, address || '', bloodType || null, JSON.stringify(allergies || [])]
      );
    } else if (role === 'doctor') {
      await conn.execute(
        'INSERT INTO doctor_details (user_id, specialization) VALUES (?, ?)',
        [id, specialization || 'Médecine Générale']
      );
    }

    await conn.commit();

    // Return the created user
    const [rows]: any = await (pool as any).query(
      'SELECT u.*, pd.date_of_birth, pd.address, pd.blood_type, pd.allergies, dd.specialization ' +
      'FROM users u ' +
      'LEFT JOIN patient_details pd ON u.id = pd.user_id ' +
      'LEFT JOIN doctor_details dd ON u.id = dd.user_id ' +
      'WHERE u.id = ?', [id]
    );
    const mapped = toCamel(rows[0]);
    if (typeof mapped.allergies === 'string') {
      try { mapped.allergies = JSON.parse(mapped.allergies); } catch { mapped.allergies = []; }
    }
    
    // Fix date for created user
    if (mapped.dateOfBirth) {
       const d = new Date(mapped.dateOfBirth as any);
       mapped.dateOfBirth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    res.status(201).json(safeUser(mapped));
  } catch (error: any) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

// PUT /api/users/:id
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { firstName, lastName, email, phone, password,
            dateOfBirth, address, bloodType, allergies, specialization } = req.body;
    const id = req.params.id;

    // Update base user
    const sets: string[] = [];
    const vals: any[] = [];
    if (firstName !== undefined) { sets.push('first_name = ?'); vals.push(firstName); }
    if (lastName !== undefined) { sets.push('last_name = ?'); vals.push(lastName); }
    if (email !== undefined) { sets.push('email = ?'); vals.push(email); }
    if (phone !== undefined) { sets.push('phone = ?'); vals.push(phone); }
    if (password !== undefined) {
      const hash = await bcrypt.hash(password, 10);
      sets.push('password_hash = ?'); vals.push(hash);
    }

    if (sets.length > 0) {
      vals.push(id);
      await conn.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
    }

    // Update patient details if provided
    if (dateOfBirth !== undefined || address !== undefined || bloodType !== undefined || allergies !== undefined) {
      // Upsert patient_details
      const [existing]: any = await conn.execute('SELECT user_id FROM patient_details WHERE user_id = ?', [id]);
      if (existing.length > 0) {
        const pdSets: string[] = [];
        const pdVals: any[] = [];
        if (dateOfBirth !== undefined) { pdSets.push('date_of_birth = ?'); pdVals.push(dateOfBirth); }
        if (address !== undefined) { pdSets.push('address = ?'); pdVals.push(address); }
        if (bloodType !== undefined) { pdSets.push('blood_type = ?'); pdVals.push(bloodType); }
        if (allergies !== undefined) { pdSets.push('allergies = ?'); pdVals.push(JSON.stringify(allergies)); }
        if (pdSets.length > 0) {
          pdVals.push(id);
          await conn.execute(`UPDATE patient_details SET ${pdSets.join(', ')} WHERE user_id = ?`, pdVals);
        }
      }
    }

    // Update doctor details if provided
    if (specialization !== undefined) {
      const [existing]: any = await conn.execute('SELECT user_id FROM doctor_details WHERE user_id = ?', [id]);
      if (existing.length > 0) {
        await conn.execute('UPDATE doctor_details SET specialization = ? WHERE user_id = ?', [specialization, id]);
      }
    }

    await conn.commit();

    // Return updated user
    const [rows]: any = await (pool as any).query(
      'SELECT u.*, pd.date_of_birth, pd.address, pd.blood_type, pd.allergies, dd.specialization ' +
      'FROM users u ' +
      'LEFT JOIN patient_details pd ON u.id = pd.user_id ' +
      'LEFT JOIN doctor_details dd ON u.id = dd.user_id ' +
      'WHERE u.id = ?', [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const mapped = toCamel(rows[0]);
    if (typeof mapped.allergies === 'string') {
      try { mapped.allergies = JSON.parse(mapped.allergies); } catch { mapped.allergies = []; }
    }
    res.json(safeUser(mapped));
  } catch (error: any) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/users/:id
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    await (pool as any).query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/users/:id/password
app.patch('/api/users/:id/password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await (pool as any).query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ══════════════════════════════════════
// APPOINTMENTS ROUTES
// ══════════════════════════════════════

// GET /api/appointments/slots
app.get('/api/appointments/slots', authenticateToken, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ message: 'doctorId and date are required' });

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

    // Use pool.query if execute is giving typing issues
    const [rows]: any = await (pool as any).query(
      "SELECT start_time FROM appointments WHERE doctor_id = ? AND date = ? AND status NOT IN ('cancelled', 'no-show')",
      [doctorId, date]
    );

    const bookedStarts = new Set(rows.map((r: any) => {
      const time = r.start_time;
      if (!time) return '';
      // MySQL TIME can be returned as string "08:00:00"
      if (typeof time === 'string') return time.slice(0, 5);
      // Or as a buffer or object depending on driver
      const str = String(time);
      if (str.includes(':')) return str.slice(0, 5);
      return str;
    }));

    const available = allSlots.filter(s => !bookedStarts.has(s.start));
    console.log(`[Slots] Doctor: ${doctorId}, Date: ${date}, Booked: ${rows.length}, Available: ${available.length}`);
    res.json(available);
  } catch (error: any) {
    console.error('[Slots Error]', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM appointments';
    const params: any[] = [];
    const conds: string[] = [];

    if (req.query.doctorId) { conds.push('doctor_id = ?'); params.push(req.query.doctorId); }
    if (req.query.patientId) { conds.push('patient_id = ?'); params.push(req.query.patientId); }
    if (req.query.date) { conds.push('date = ?'); params.push(req.query.date); }
    
    if (conds.length) {
      sql += ' WHERE ' + conds.join(' AND ');
    }
    sql += ' ORDER BY date ASC, start_time ASC';

    const [rows]: any = await (pool as any).query(sql, params);
    const mapped = rows.map((r: any) => {
      const m = toCamel(r);
      
      // Extract time from MySQL TIME or string
      const formatTime = (t: any) => {
        if (!t) return '';
        const s = String(t);
        return s.includes(':') ? s.slice(0, 5) : s;
      };

      m.timeSlot = { 
        start: formatTime(r.start_time), 
        end: formatTime(r.end_time) 
      };
      
      m.patientId = r.patient_id;
      m.doctorId = r.doctor_id;
      m.consultationId = r.consultation_id;
      
      // Fix date object to string YYYY-MM-DD (handling timezones)
      if (r.date) {
        const d = new Date(r.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        m.date = `${year}-${month}-${day}`;
      }
      return m;
    });
    res.json(mapped);
  } catch (error: any) {
    console.error('[API Appointments Error]', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/appointments
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { patientId, doctorId, date, timeSlot, reason, status } = req.body;
    const id = randomUUID();
    await (pool as any).query(
      'INSERT INTO appointments (id, patient_id, doctor_id, date, start_time, end_time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, patientId, doctorId, date, timeSlot?.start, timeSlot?.end, reason || '', status || 'pending']
    );
    const [rows]: any = await (pool as any).query('SELECT * FROM appointments WHERE id = ?', [id]);
    const m = toCamel(rows[0]);
    m.timeSlot = { start: String(rows[0].start_time).slice(0, 5), end: String(rows[0].end_time).slice(0, 5) };
    res.status(201).json(m);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/appointments/:id
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const sets: string[] = [];
    const vals: any[] = [];
    const body = req.body;

    if (body.patientId !== undefined) { sets.push('patient_id = ?'); vals.push(body.patientId); }
    if (body.doctorId !== undefined) { sets.push('doctor_id = ?'); vals.push(body.doctorId); }
    if (body.date !== undefined) { sets.push('date = ?'); vals.push(body.date); }
    if (body.status !== undefined) { sets.push('status = ?'); vals.push(body.status); }
    if (body.reason !== undefined) { sets.push('reason = ?'); vals.push(body.reason); }
    if (body.consultationId !== undefined) { sets.push('consultation_id = ?'); vals.push(body.consultationId); }
    if (body.timeSlot) {
      sets.push('start_time = ?', 'end_time = ?');
      vals.push(body.timeSlot.start, body.timeSlot.end);
    }

    if (sets.length === 0) return res.status(400).json({ message: 'Rien à mettre à jour' });
    vals.push(req.params.id);
    await (pool as any).query(`UPDATE appointments SET ${sets.join(', ')} WHERE id = ?`, vals);

    const [rows]: any = await (pool as any).query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'RDV non trouvé' });
    const m = toCamel(rows[0]);
    m.timeSlot = { start: String(rows[0].start_time).slice(0, 5), end: String(rows[0].end_time).slice(0, 5) };
    res.json(m);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/appointments/:id
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    await (pool as any).query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ══════════════════════════════════════
// CONSULTATIONS ROUTES
// ══════════════════════════════════════

// GET /api/consultations
app.get('/api/consultations', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM consultations';
    const params: any[] = [];
    const conds: string[] = [];

    if (req.query.patientId) { conds.push('patient_id = ?'); params.push(req.query.patientId); }
    if (req.query.doctorId) { conds.push('doctor_id = ?'); params.push(req.query.doctorId); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY date DESC';

    const [rows]: any = await (pool as any).query(sql, params);
    const mapped = rows.map((r: any) => {
      const m = toCamel(r);
      m.isPresent = !!r.is_present;
      m.patientId = r.patient_id;
      m.doctorId = r.doctor_id;
      m.appointmentId = r.appointment_id;
      
      if (r.date) {
        const d = new Date(r.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        m.date = `${year}-${month}-${day}`;
      }
      return m;
    });

    // Fetch prescriptions for each consultation
    for (const m of mapped) {
      const [rxRows]: any = await (pool as any).query(
        'SELECT medication_name, dosage, duration, instructions FROM prescriptions WHERE consultation_id = ?',
        [m.id]
      );
      m.prescription = rxRows.map((rx: any) => ({
        name: rx.medication_name,
        dosage: rx.dosage,
        duration: rx.duration,
        instructions: rx.instructions,
      }));
    }

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/consultations
app.post('/api/consultations', authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { appointmentId, patientId, doctorId, date, isPresent, report, diagnosis, prescription, notes } = req.body;
    const consId = randomUUID();

    await (conn as any).query(
      'INSERT INTO consultations (id, appointment_id, patient_id, doctor_id, date, is_present, report, diagnosis, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [consId, appointmentId, patientId, doctorId, date, isPresent ? 1 : 0, report || '', diagnosis || '', notes || '']
    );

    // Insert prescriptions
    if (Array.isArray(prescription)) {
      for (const med of prescription) {
        if (med.name) {
          await (conn as any).query(
            'INSERT INTO prescriptions (id, consultation_id, medication_name, dosage, duration, instructions) VALUES (?, ?, ?, ?, ?, ?)',
            [randomUUID(), consId, med.name, med.dosage || '', med.duration || '', med.instructions || '']
          );
        }
      }
    }

    // Update appointment status
    await (conn as any).query(
      'UPDATE appointments SET status = ?, consultation_id = ? WHERE id = ?',
      [isPresent ? 'completed' : 'no-show', consId, appointmentId]
    );

    await conn.commit();
    res.status(201).json({ id: consId, success: true });
  } catch (error: any) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

// ══════════════════════════════════════
// SEED DATA (auto-seed on first run)
// ══════════════════════════════════════

async function seedDatabase() {
  try {
    const [rows]: any = await (pool as any).query('SELECT COUNT(*) as cnt FROM users');
    if (rows[0].cnt > 0) return;

    console.log('🌱 Seeding database with demo data...');

    const h = (pwd: string) => bcrypt.hashSync(pwd, 10);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Users
    const users = [
      ['admin-1', 'admin@cabinet.fr',   h('admin123'),   'admin',     'Admin',   'Système',  '0600000000'],
      ['doc-1',   'dupont@cabinet.fr',  h('doctor123'),  'doctor',    'Jean',    'Dupont',   '0612345678'],
      ['doc-2',   'martin@cabinet.fr',  h('doctor123'),  'doctor',    'Claire',  'Martin',   '0623456789'],
      ['sec-1',   'marie@cabinet.fr',   h('secret123'),  'secretary', 'Marie',   'Laurent',  '0634567890'],
      ['pat-1',   'ahmed@email.com',    h('patient123'), 'patient',   'Ahmed',   'Benali',   '0645678901'],
      ['pat-2',   'sophie@email.com',   h('patient123'), 'patient',   'Sophie',  'Dubois',   '0656789012'],
      ['pat-3',   'karim@email.com',    h('patient123'), 'patient',   'Karim',   'Hassan',   '0667890123'],
    ];
    await pool.query(
      'INSERT INTO users (id,email,password_hash,role,first_name,last_name,phone) VALUES ?',
      [users]
    );

    // Patient details
    await pool.query(
      'INSERT INTO patient_details (user_id,date_of_birth,address,blood_type,allergies) VALUES ?',
      [[
        ['pat-1', '1985-03-15', '12 Rue des Lilas, 75011 Paris', 'A+', '["Pénicilline"]'],
        ['pat-2', '1990-07-22', '8 Avenue Victor Hugo, 75016 Paris', 'O-', '[]'],
        ['pat-3', '1978-11-30', '45 Boulevard Haussmann, 75009 Paris', 'B+', '["Aspirine","Sulfamides"]'],
      ]]
    );

    // Doctor details
    await pool.query(
      'INSERT INTO doctor_details (user_id,specialization) VALUES ?',
      [[
        ['doc-1', 'Médecine Générale'],
        ['doc-2', 'Médecine Générale'],
      ]]
    );

    // Appointments
    await (pool as any).query(
      'INSERT INTO appointments (id,patient_id,doctor_id,date,start_time,end_time,status,reason) VALUES ?',
      [[
        ['apt-1', 'pat-1', 'doc-1', today,    '09:00:00', '09:30:00', 'confirmed', 'Douleur au dos'],
        ['apt-2', 'pat-2', 'doc-1', today,    '09:30:00', '10:00:00', 'pending',   'Consultation annuelle'],
        ['apt-3', 'pat-3', 'doc-2', today,    '10:00:00', '10:30:00', 'confirmed', 'Suivi hypertension'],
        ['apt-4', 'pat-1', 'doc-1', tomorrow, '14:00:00', '14:30:00', 'pending',   'Renouvellement ordonnance'],
        ['apt-5', 'pat-2', 'doc-2', tomorrow, '11:00:00', '11:30:00', 'cancelled', 'Fièvre'],
        ['apt-old-1', 'pat-1', 'doc-1', '2025-05-15', '09:00:00', '09:30:00', 'completed', 'Douleur au dos'],
        ['apt-old-2', 'pat-3', 'doc-2', '2025-05-20', '10:00:00', '10:30:00', 'completed', 'Contrôle tension'],
      ]]
    );

    // Consultations
    await (pool as any).query(
      'INSERT INTO consultations (id,appointment_id,patient_id,doctor_id,date,is_present,report,diagnosis,notes) VALUES ?',
      [[
        ['cons-1', 'apt-old-1', 'pat-1', 'doc-1', '2025-05-15', 1,
         'Patient présentant des douleurs lombaires depuis 2 semaines.', 'Lombalgie commune',
         'Repos recommandé.'],
        ['cons-2', 'apt-old-2', 'pat-3', 'doc-2', '2025-05-20', 1,
         'Contrôle tension artérielle. PA: 14/8.', 'HTA contrôlée',
         'Continuer le traitement.'],
      ]]
    );

    // Prescriptions
    await pool.query(
      'INSERT INTO prescriptions (id,consultation_id,medication_name,dosage,duration,instructions) VALUES ?',
      [[
        [randomUUID(), 'cons-1', 'Paracétamol', '1g', '7 jours', '3 fois par jour si douleur'],
        [randomUUID(), 'cons-1', 'Myorelaxant', '4mg', '5 jours', '1 comprimé le soir'],
        [randomUUID(), 'cons-2', 'Amlodipine', '5mg', '3 mois', '1 comprimé par jour'],
      ]]
    );

    console.log('✅ Database seeded with demo data (bcrypt hashed passwords)');
  } catch (err: any) {
    console.error('⚠️ Seed failed:', err.message);
  }
}

// ══════════════════════════════════════
// SERVE FRONTEND IN PRODUCTION
// ══════════════════════════════════════
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// ══════════════════════════════════════
// START SERVER
// ══════════════════════════════════════
async function start() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL');
    conn.release();

    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`   API:    http://localhost:${PORT}/api`);
    });
  } catch (err: any) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Run: mysql -u root -p < database/schema.sql');
    process.exit(1);
  }
}

start();
