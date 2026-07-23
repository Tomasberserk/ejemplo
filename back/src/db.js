import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPostgres = !!process.env.DATABASE_URL;

let pool;
let sqliteDb;

if (isPostgres) {
  const { Pool } = pg;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
  });
  console.log('Database type: PostgreSQL');
} else {
  const isVercel = process.env.VERCEL === '1';
  const dbPath = isVercel 
    ? '/tmp/database.sqlite' 
    : path.resolve(__dirname, '../database.sqlite');
  
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Database type: SQLite (Local) at:', dbPath);
    }
  });
}

// ── Placeholder converter: SQLite ? → PostgreSQL $1, $2, ... ─────────────────
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ── Query helpers (same API as the old sqlite3 wrappers) ──────────────────────

/** Execute a SELECT-like query, returns array of rows */
export const query = async (rawSql, params = []) => {
  if (isPostgres) {
    const { rows } = await pool.query(toPg(rawSql), params);
    return rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(rawSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

/** Execute an INSERT / UPDATE / DELETE, returns { id, changes } */
export const run = async (rawSql, params = []) => {
  if (isPostgres) {
    const result = await pool.query(toPg(rawSql), params);
    return { id: null, changes: result.rowCount };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(rawSql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

/** Execute a query and return ONLY the first row (or null) */
export const get = async (rawSql, params = []) => {
  if (isPostgres) {
    const { rows } = await pool.query(toPg(rawSql), params);
    return rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(rawSql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

// ── Schema initialization ─────────────────────────────────────────────────────
export async function initDb() {
  // SQLite schema migration fallback: DROP late_requests table if it lacks created_at column
  try {
    if (!isPostgres) {
      const tableCheck = await get(`SELECT name FROM sqlite_master WHERE type='table' AND name='late_requests'`);
      if (tableCheck) {
        const cols = await query(`PRAGMA table_info(late_requests)`);
        const hasCreatedAt = cols.some(c => c.name === 'created_at');
        if (!hasCreatedAt) {
          await run(`DROP TABLE late_requests`);
          console.log('Migration Cleanup: Dropped outdated late_requests table in SQLite');
        }
      }
    }
  } catch (err) {
    console.error('Pre-init migration cleanup error:', err.message);
  }

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
      ip_check_enabled INTEGER DEFAULT 1,
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

  await run(`
    CREATE TABLE IF NOT EXISTS late_requests (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      institution_id TEXT,
      unit_id TEXT,
      documento TEXT,
      nombre TEXT,
      justification TEXT,
      status TEXT DEFAULT 'pending',
      horas_descontar INTEGER DEFAULT 1,
      created_at TEXT
    )
  `);

  // Migration: Add created_at column to late_requests if not exists
  try {
    if (isPostgres) {
      try {
        await run(`ALTER TABLE late_requests ADD COLUMN created_at TEXT`);
        console.log('Migration: Added created_at column to late_requests in Postgres');
      } catch (err) {
        if (err.code !== '42701') throw err; // Ignore 'column already exists'
      }
    } else {
      const columns = await query(`PRAGMA table_info(late_requests)`);
      const hasCreatedAt = columns.some(col => col.name === 'created_at');
      if (!hasCreatedAt) {
        await run(`ALTER TABLE late_requests ADD COLUMN created_at TEXT`);
        console.log('Migration: Added created_at column to late_requests in SQLite');
      }
    }
  } catch (migErr) {
    console.error('Migration error (non-fatal) late_requests:', migErr.message);
  }

  // Migration: Add ip_check_enabled column to attendance_sessions if not exists
  try {
    if (isPostgres) {
      try {
        await run(`ALTER TABLE attendance_sessions ADD COLUMN ip_check_enabled INTEGER DEFAULT 1`);
        console.log('Migration: Added ip_check_enabled column to attendance_sessions in Postgres');
      } catch (err) {
        if (err.code !== '42701') throw err; // Ignore 'column already exists'
      }
    } else {
      const columns = await query(`PRAGMA table_info(attendance_sessions)`);
      const hasIpCheck = columns.some(col => col.name === 'ip_check_enabled');
      if (!hasIpCheck) {
        await run(`ALTER TABLE attendance_sessions ADD COLUMN ip_check_enabled INTEGER DEFAULT 1`);
        console.log('Migration: Added ip_check_enabled column to attendance_sessions in SQLite');
      }
    }
  } catch (migErr) {
    console.error('Migration error (non-fatal) attendance_sessions.ip_check_enabled:', migErr.message);
  }

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
    const unit1Id = 'unit_ficha_3413974';
    const unit2Id = 'unit_ficha_2503400';
    await run(`
      INSERT INTO academic_units (id, institution_id, code, name, type, active)
      VALUES 
      (?, ?, ?, ?, ?, 1),
      (?, ?, ?, ?, ?, 1)
    `, [
      unit1Id, instId, '3413974', 'Análisis y Desarrollo de Software (ADSO)', 'ficha',
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

  // Incondicional: Asegurar que el Coordinador exista en la BD (local o Vercel)
  try {
    const existingCoord = await get("SELECT id FROM people WHERE documento = '9999999999'");
    if (!existingCoord) {
      const instId = 'inst_sena_1';
      // Ensure institution SENA exists first (just in case)
      const inst = await get("SELECT id FROM institutions WHERE id = ?", [instId]);
      if (!inst) {
        await run(`
          INSERT INTO institutions (id, code, name, context, labels, theme, qr_ttl_minutes, active)
          VALUES (?, 'SENA', 'Servicio Nacional de Aprendizaje', 'sena', ?, ?, 10, 1)
        `, [instId, JSON.stringify({ role: 'Instructor', unit: 'Ficha', person: 'Aprendiz' }), JSON.stringify({ primary: '#39A900', secondary: '#003049' })]);
      }

      const passCoord = await bcrypt.hash('coord.2026', 10);
      await run(`
        INSERT INTO people (id, institution_id, documento, nombre, matricula, active, password, roles)
        VALUES (?, ?, '9999999999', 'Coordinador SENA', 'MAT-COORD', 1, ?, ?)
      `, ['per_coord_1', instId, passCoord, JSON.stringify(['COORDINADOR'])]);
      console.log('Database Init: Seeded Coordinator 9999999999 successfully!');
    }
  } catch (err) {
    console.error('Error ensuring Coordinator seed:', err.message);
  }

  // Incondicional: Limpiar la BD para dejar únicamente a Tomas Berserk
  try {
    // Delete enrollments for other people who are APRENDIZ
    await run(`
      DELETE FROM enrollments 
      WHERE person_id NOT IN (
        SELECT id FROM people 
        WHERE documento = '1077228780' OR roles LIKE '%INSTRUCTOR%' OR roles LIKE '%COORDINADOR%'
      )
    `);
    
    // Delete people who are APRENDIZ and not Tomas
    await run(`
      DELETE FROM people 
      WHERE documento NOT IN ('1077228780', '9999999999', '1079606375', '0000000001')
      AND roles LIKE '%APRENDIZ%'
    `);
    console.log('Database Init: Student list cleaned successfully (Tomas Berserk kept).');
  } catch (err) {
    console.error('Database Init: Error cleaning students:', err.message);
  }
}

