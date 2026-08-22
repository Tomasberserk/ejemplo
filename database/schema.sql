-- =============================================================================
-- ESQUEMA DE BASE DE DATOS CANÓNICO — sena-attendance-system
-- Compatible con SQLite (Local) y PostgreSQL (Producción)
-- =============================================================================

CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT,
  context TEXT,
  labels TEXT,
  theme TEXT,
  qr_ttl_minutes INTEGER,
  active INTEGER
);

CREATE TABLE IF NOT EXISTS academic_units (
  id TEXT PRIMARY KEY,
  institution_id TEXT,
  code TEXT UNIQUE,
  name TEXT,
  type TEXT,
  active INTEGER,
  FOREIGN KEY(institution_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  institution_id TEXT,
  documento TEXT,
  nombre TEXT,
  matricula TEXT,
  active INTEGER,
  password TEXT,
  roles TEXT,
  photo_reference TEXT,
  terms_accepted INTEGER DEFAULT 0,
  must_change_password INTEGER DEFAULT 0,
  FOREIGN KEY(institution_id) REFERENCES institutions(id),
  UNIQUE(institution_id, documento)
);

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
);

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
  evidence_submitted INTEGER DEFAULT 0,
  evidence_submitted_at TEXT,
  created_by TEXT,
  FOREIGN KEY(institution_id) REFERENCES institutions(id),
  FOREIGN KEY(unit_id) REFERENCES academic_units(id)
);

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
  photo_evidence TEXT,
  biometric_match_score REAL,
  verification_method TEXT,
  FOREIGN KEY(session_id) REFERENCES attendance_sessions(id),
  FOREIGN KEY(institution_id) REFERENCES institutions(id),
  FOREIGN KEY(unit_id) REFERENCES academic_units(id),
  FOREIGN KEY(person_id) REFERENCES people(id)
);

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
);

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
);
