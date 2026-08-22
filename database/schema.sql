-- ============================================================
-- SENA ATTENDANCE SYSTEM - ESQUEMA CANÓNICO DE BASE DE DATOS
-- Compatible con SQLite3 y PostgreSQL
-- ============================================================

-- 1. Instituciones
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  context TEXT NOT NULL,
  labels TEXT NOT NULL,
  theme TEXT NOT NULL,
  qr_ttl_minutes INTEGER DEFAULT 10,
  active INTEGER DEFAULT 1
);

-- 2. Unidades Académicas (Fichas / Materias)
CREATE TABLE IF NOT EXISTS academic_units (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'ficha',
  active INTEGER DEFAULT 1,
  FOREIGN KEY(institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

-- 3. Personas (Instructores, Aprendices, Coordinadores)
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  documento TEXT NOT NULL,
  nombre TEXT NOT NULL,
  matricula TEXT,
  active INTEGER DEFAULT 1,
  password TEXT NOT NULL,
  roles TEXT NOT NULL,
  photo_reference TEXT,
  terms_accepted INTEGER DEFAULT 0,
  FOREIGN KEY(institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  UNIQUE(institution_id, documento)
);

-- 4. Matrículas (Asociación Persona <-> Ficha)
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  FOREIGN KEY(institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY(unit_id) REFERENCES academic_units(id) ON DELETE CASCADE,
  FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE,
  UNIQUE(unit_id, person_id)
);

-- 5. Sesiones de Asistencia (Salas de Control)
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  qr_token TEXT,
  qr_expires_at TEXT,
  qr_ttl_minutes INTEGER DEFAULT 15,
  activated_at TEXT,
  closed_at TEXT,
  room_created_at TEXT,
  room_expires_at TEXT,
  is_reopened INTEGER DEFAULT 0,
  creator_ip TEXT,
  ip_check_enabled INTEGER DEFAULT 1,
  evidence_submitted INTEGER DEFAULT 0,
  evidence_submitted_at TEXT,
  created_by TEXT,
  FOREIGN KEY(institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY(unit_id) REFERENCES academic_units(id) ON DELETE CASCADE
);

-- 6. Registros Individuales de Asistencia
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  documento TEXT NOT NULL,
  status TEXT NOT NULL,
  reject_reason TEXT,
  message TEXT,
  hora_ingreso_real TEXT,
  hora_salida_real TEXT,
  horas_programadas_sesion INTEGER DEFAULT 6,
  horas_validadas_asistencia INTEGER DEFAULT 6,
  horas_inasistencia_acumulada INTEGER DEFAULT 0,
  tipo_registro TEXT DEFAULT 'REGULAR',
  created_at TEXT NOT NULL,
  client_ip TEXT,
  photo_evidence TEXT,
  biometric_match_score REAL,
  verification_method TEXT DEFAULT 'manual',
  FOREIGN KEY(session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY(unit_id) REFERENCES academic_units(id) ON DELETE CASCADE,
  FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
);

-- 7. Excusas y Justificaciones
CREATE TABLE IF NOT EXISTS excuses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  text TEXT NOT NULL,
  file_name TEXT,
  file_data TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
);

-- 8. Solicitudes de Asistencia Tardía (Excepciones)
CREATE TABLE IF NOT EXISTS late_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  institution_id TEXT,
  unit_id TEXT,
  documento TEXT NOT NULL,
  nombre TEXT NOT NULL,
  justification TEXT,
  status TEXT DEFAULT 'pending',
  horas_descontar INTEGER DEFAULT 1,
  created_at TEXT
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_people_doc ON people(documento);
CREATE INDEX IF NOT EXISTS idx_enrollments_unit ON enrollments(unit_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_person ON enrollments(person_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_person ON attendance_records(person_id);
