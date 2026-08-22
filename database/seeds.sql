-- ============================================================
-- SENA ATTENDANCE SYSTEM - DATOS SEMILLA (SEEDS)
-- ============================================================

-- 1. Institución Base: SENA
INSERT INTO institutions (id, code, name, context, labels, theme, qr_ttl_minutes, active)
VALUES (
  'inst_sena_1',
  'SENA',
  'Servicio Nacional de Aprendizaje',
  'sena',
  '{"role": "Instructor", "unit": "Ficha", "person": "Aprendiz"}',
  '{"primary": "#39A900", "secondary": "#003049"}',
  10,
  1
) ON CONFLICT(id) DO NOTHING;

-- 2. Fichas Académicas
INSERT INTO academic_units (id, institution_id, code, name, type, active)
VALUES 
  ('unit_ficha_3413974', 'inst_sena_1', '3413974', 'Análisis y Desarrollo de Software (ADSO)', 'ficha', 1),
  ('unit_ficha_2503400', 'inst_sena_1', '2503400', 'Gestión de Redes de Datos', 'ficha', 1)
ON CONFLICT(id) DO NOTHING;

-- 3. Usuarios Principales
-- Jesus Gonzalez: 'qwerty.2026'
-- Instructor SENA: '1079606375'
-- Coordinador SENA: 'coord.2026'
-- Tomas Berserk: '1077228780'

INSERT INTO people (id, institution_id, documento, nombre, matricula, active, password, roles, terms_accepted)
VALUES
  ('per_jesus_1', 'inst_sena_1', '0000000001', 'Jesus Gonzalez', 'MAT-001', 1, '$2a$10$Wn24yL1UfgXNfU1hV6lYt.bQJjJc50hQfVZZmDk9OiqYj09mG1f/O', '["INSTRUCTOR"]', 1),
  ('per_inst_1', 'inst_sena_1', '1079606375', 'Instructor SENA', 'MAT-002', 1, '1079606375', '["INSTRUCTOR"]', 1),
  ('per_coord_1', 'inst_sena_1', '9999999999', 'Coordinador SENA', 'MAT-COORD', 1, '$2a$10$Wn24yL1UfgXNfU1hV6lYt.bQJjJc50hQfVZZmDk9OiqYj09mG1f/O', '["COORDINADOR"]', 1),
  ('per_apr_7', 'inst_sena_1', '1077228780', 'Tomas Berserk', 'MAT-AV2', 1, '1077228780', '["APRENDIZ"]', 0)
ON CONFLICT(id) DO NOTHING;

-- 4. Matrícula Inicial (Tomas Berserk en ADSO 3413974)
INSERT INTO enrollments (id, institution_id, unit_id, person_id, active)
VALUES ('enr_per_apr_7_unit_ficha_3413974', 'inst_sena_1', 'unit_ficha_3413974', 'per_apr_7', 1)
ON CONFLICT(id) DO NOTHING;
