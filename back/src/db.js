import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// ── Connection ────────────────────────────────────────────────────────────────
// Requires DATABASE_URL env var (Neon connection string)
// Format: postgresql://user:password@host/database?sslmode=require
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// ── Placeholder converter: SQLite ? → PostgreSQL $1, $2, ... ─────────────────
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ── Query helpers (same API as the old sqlite3 wrappers) ──────────────────────

/** Execute a SELECT-like query, returns array of rows */
export const query = async (rawSql, params = []) => {
  const { rows } = await pool.query(toPg(rawSql), params);
  return rows;
};

/** Execute an INSERT / UPDATE / DELETE, returns { id, changes } */
export const run = async (rawSql, params = []) => {
  const result = await pool.query(toPg(rawSql), params);
  return { id: null, changes: result.rowCount };
};

/** Execute a query and return ONLY the first row (or null) */
export const get = async (rawSql, params = []) => {
  const { rows } = await pool.query(toPg(rawSql), params);
  return rows[0] || null;
};

// ── Schema initialization ─────────────────────────────────────────────────────
export async function initDb() {
  // Create tables
  await run(`
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT,
      context TEXT,
      labels TEXT,
      theme TEXT,
      qr_ttl_minutes INTEGER,
      active INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS academic_units (
      id TEXT PRIMARY KEY,
      institution_id TEXT,
      code TEXT UNIQUE,
      name TEXT,
      type TEXT,
      active INTEGER,
      FOREIGN KEY(institution_id) REFERENCES institutions(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      institution_id TEXT,
      documento TEXT,
      nombre TEXT,
      matricula TEXT,
      active INTEGER,
      password TEXT,
      roles TEXT,
      FOREIGN KEY(institution_id) REFERENCES institutions(id),
      UNIQUE(institution_id, documento)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      institution_id TEXT,
      unit_id TEXT,
      person_id TEXT,
      active INTEGER,
      FOREIGN KEY(institution_id) REFERENCES institutions(id),
      FOREIGN KEY(unit_id) REFERENCES academic_units(id),
      FOREIGN KEY(person_id) REFERENCES people(id),
      UNIQUE(unit_id, person_id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id TEXT PRIMARY KEY,
      institution_id TEXT,
      unit_id TEXT,
      status TEXT,
      qr_token TEXT,
      qr_expires_at TEXT,
      qr_ttl_minutes INTEGER,
      activated_at TEXT,
      closed_at TEXT,
      room_created_at TEXT,
      room_expires_at TEXT,
      is_reopened INTEGER,
      creator_ip TEXT,
      FOREIGN KEY(institution_id) REFERENCES institutions(id),
      FOREIGN KEY(unit_id) REFERENCES academic_units(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      institution_id TEXT,
      unit_id TEXT,
      person_id TEXT,
      documento TEXT,
      status TEXT,
      reject_reason TEXT,
      message TEXT,
      hora_ingreso_real TEXT,
      hora_salida_real TEXT,
      horas_programadas_sesion INTEGER,
      horas_validadas_asistencia INTEGER,
      horas_inasistencia_acumulada INTEGER,
      tipo_registro TEXT,
      created_at TEXT,
      client_ip TEXT,
      FOREIGN KEY(session_id) REFERENCES attendance_sessions(id),
      FOREIGN KEY(institution_id) REFERENCES institutions(id),
      FOREIGN KEY(unit_id) REFERENCES academic_units(id),
      FOREIGN KEY(person_id) REFERENCES people(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS excuses (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      person_id TEXT,
      text TEXT,
      file_name TEXT,
      file_data TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT,
      FOREIGN KEY(session_id) REFERENCES attendance_sessions(id),
      FOREIGN KEY(person_id) REFERENCES people(id)
    )
  `);

  // Seed data if institutions is empty
  // NOTE: PostgreSQL returns COUNT(*) as string (bigint), use Number() to compare
  const instCount = await get('SELECT COUNT(*) as count FROM institutions');
  if (Number(instCount.count) === 0) {
    console.log('Seeding database with SENA data...');

    // Seed institution (SENA)
    const instId = 'inst_sena_1';
    await run(`
      INSERT INTO institutions (id, code, name, context, labels, theme, qr_ttl_minutes, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      instId,
      'SENA',
      'Servicio Nacional de Aprendizaje',
      'sena',
      JSON.stringify({ role: 'Instructor', unit: 'Ficha', person: 'Aprendiz' }),
      JSON.stringify({ primary: '#39A900', secondary: '#003049' }),
      10,
      1
    ]);

    // Seed academic units (fichas)
    const unit1Id = 'unit_ficha_2503399';
    const unit2Id = 'unit_ficha_2503400';
    await run(`
      INSERT INTO academic_units (id, institution_id, code, name, type, active)
      VALUES 
      (?, ?, ?, ?, ?, 1),
      (?, ?, ?, ?, ?, 1)
    `, [
      unit1Id, instId, '2503399', 'Análisis y Desarrollo de Software (ADSO)', 'ficha',
      unit2Id, instId, '2503400', 'Gestión de Redes de Datos', 'ficha'
    ]);

    // Seed people (Instructores & Aprendices)
    const passJesus = await bcrypt.hash('qwerty.2026', 10);
    const passInstructor = '1079606375';

    const pJesusId = 'per_jesus_1';
    const pInstId = 'per_inst_1';

    await run(`
      INSERT INTO people (id, institution_id, documento, nombre, matricula, active, password, roles)
      VALUES 
      (?, ?, ?, ?, ?, 1, ?, ?),
      (?, ?, ?, ?, ?, 1, ?, ?)
    `, [
      pJesusId, instId, '0000000001', 'Jesus Gonzalez', 'MAT-001', passJesus, JSON.stringify(['INSTRUCTOR']),
      pInstId, instId, '1079606375', 'Instructor SENA', 'MAT-002', passInstructor, JSON.stringify(['INSTRUCTOR'])
    ]);

    // Seed Aprendices (documento as password)
    const learners = [
      { id: 'per_apr_1', doc: '1001001001', name: 'Juan Perez',       mat: 'MAT-A1', units: [unit1Id] },
      { id: 'per_apr_2', doc: '1002002002', name: 'Maria Lopez',      mat: 'MAT-A2', units: [unit1Id] },
      { id: 'per_apr_3', doc: '1003003003', name: 'Carlos Gomez',     mat: 'MAT-A3', units: [unit1Id] },
      { id: 'per_apr_4', doc: '1004004004', name: 'Ana Rodriguez',    mat: 'MAT-A4', units: [unit2Id] },
      { id: 'per_apr_5', doc: '1005005005', name: 'Luis Martinez',    mat: 'MAT-A5', units: [unit2Id] },
      { id: 'per_apr_6', doc: '1075508460', name: 'Aprendiz SENA Validado', mat: 'MAT-AV1', units: [unit1Id] },
      { id: 'per_apr_7', doc: '1077228780', name: 'Tomas Berserk',    mat: 'MAT-AV2', units: [unit1Id] }
    ];

    for (const l of learners) {
      await run(`
        INSERT INTO people (id, institution_id, documento, nombre, matricula, active, password, roles)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `, [l.id, instId, l.doc, l.name, l.mat, l.doc, JSON.stringify(['APRENDIZ'])]);

      for (const unitId of l.units) {
        await run(`
          INSERT INTO enrollments (id, institution_id, unit_id, person_id, active)
          VALUES (?, ?, ?, ?, 1)
        `, [`enr_${l.id}_${unitId}`, instId, unitId, l.id]);
      }
    }

    console.log('Database seeded successfully!');
  }
}

