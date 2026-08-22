-- =============================================================================
-- DATOS SEMILLA (SEEDS) INICIALES — sena-attendance-system
-- =============================================================================

-- Institución SENA
INSERT OR IGNORE INTO institutions (id, code, name, context, labels, theme, qr_ttl_minutes, active)
VALUES (
  'inst_sena',
  'SENA',
  'Servicio Nacional de Aprendizaje',
  'sena',
  '{"formador":"Instructor","unidad":"Ficha","persona":"Aprendiz"}',
  '{"primary":"#39A900","secondary":"#003049","accent":"#F77F00"}',
  15,
  1
);

-- Institución Universidad / CORHUILA
INSERT OR IGNORE INTO institutions (id, code, name, context, labels, theme, qr_ttl_minutes, active)
VALUES (
  'inst_corhuila',
  'CORHUILA',
  'Corporación Universitaria del Huila',
  'universidad',
  '{"formador":"Docente","unidad":"Materia","persona":"Estudiante"}',
  '{"primary":"#1B365D","secondary":"#4A777A","accent":"#C29B38"}',
  15,
  1
);

-- Ficha Formativa SENA ADSO
INSERT OR IGNORE INTO academic_units (id, institution_id, code, name, type, active)
VALUES (
  'unit_ficha_3413974',
  'inst_sena',
  '3413974',
  'ADSO - Análisis y Desarrollo de Software',
  'Ficha',
  1
);

-- Usuarios Iniciales de Desarrollo:
-- 1. Instructor SENA (Password por defecto en texto plano para desarrollo)
INSERT OR IGNORE INTO people (id, institution_id, documento, nombre, matricula, active, password, roles, terms_accepted)
VALUES (
  'person_inst_sena',
  'inst_sena',
  '1079606375',
  'Instructor SENA',
  'INS-001',
  1,
  '1079606375',
  '["INSTRUCTOR"]',
  1
);

-- 2. Coordinador Académico SENA (Contraseña encriptada bcrypt: coord.2026)
INSERT OR IGNORE INTO people (id, institution_id, documento, nombre, matricula, active, password, roles, terms_accepted)
VALUES (
  'person_coord_sena',
  'inst_sena',
  '9999999999',
  'Coordinador SENA',
  'COORD-001',
  1,
  '$2a$10$wE8wY01Q67104b901j3vU.2q7eGZfV1g5L3WkYv6M0N1O2P3Q4R5S',
  '["COORDINADOR"]',
  1
);

-- 3. Aprendiz Tomás Berserk (Matriculado en ADSO)
INSERT OR IGNORE INTO people (id, institution_id, documento, nombre, matricula, active, password, roles, terms_accepted)
VALUES (
  'person_ap_tomas',
  'inst_sena',
  '1077228780',
  'Tomás Berserk',
  'APR-001',
  1,
  '1077228780',
  '["APRENDIZ"]',
  1
);

-- Matrícula de Tomás en la Ficha ADSO 3413974
INSERT OR IGNORE INTO enrollments (id, institution_id, unit_id, person_id, active)
VALUES (
  'enr_tomas_3413974',
  'inst_sena',
  'unit_ficha_3413974',
  'person_ap_tomas',
  1
);
