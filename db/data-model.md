# Modelo de Datos Relacional (SQLite / PostgreSQL)

Este documento detalla el diseño de persistencia de datos implementado en el sistema `app-attendance`.

---

## 1. Alcance y Estrategia

El sistema utiliza una base de datos relacional portátil:
- **SQLite3:** Para entornos de desarrollo local y pruebas (almacenada en el archivo local `back/database.sqlite`).
- **PostgreSQL:** Conector listo para producción en la nube (ej. Vercel, Render) que se activa automáticamente al definir la variable de entorno `DATABASE_URL`.

Los datos se inicializan automáticamente al arrancar el servidor mediante el script `initDb` ubicado en `back/src/db.js`. El seed carga configuraciones por defecto para la institución "SENA" (Fichas, Aprendices e Instructores) y "CORHUILA" (Docentes y Materias), manteniendo a "Tomas Berserk" como aprendiz de pruebas limpio en la base de datos.

---

## 2. Diagrama de Tablas y Relaciones

El esquema físico de base de datos se estructura bajo el siguiente modelo relacional:

```
┌─────────────────┐             ┌──────────────────┐
│   institutions  │◄───┐        │  academic_units  │
├─────────────────┤    │        ├──────────────────┤
│ id (PK, TEXT)   │    └───────-│ id (PK, TEXT)    │
│ code (UQ, TEXT) │             │ institution_id   │
└────────┬────────┘             │ code (UQ, TEXT)  │
         │                      └────────┬─────────┘
         │                               │
         │ ┌─────────────────────────────┘
         ▼ ▼
┌─────────────────┐             ┌──────────────────┐
│     people      │             │    enrollments   │
├─────────────────┤             ├──────────────────┤
│ id (PK, TEXT)   │◄────────────┤ id (PK, TEXT)    │
│ institution_id  │             │ institution_id   │
│ documento (TEXT)│◄───────────-│ unit_id (FK)     │
│ password (TEXT) │             │ person_id (FK)   │
│ roles (TEXT)    │             └──────────────────┘
└────────┬────────┘
         │
         ▼
┌──────────────────┐            ┌──────────────────┐
│      excuses     │            │attendance_records│
├──────────────────┤            ├──────────────────┤
│ id (PK, TEXT)    │            │ id (PK, TEXT)    │
│ session_id (FK)  │◄───────────┤ session_id (FK)  │
│ person_id (FK)   │            │ person_id (FK)   │
│ text (TEXT)      │            │ status (TEXT)    │
└──────────────────┘            └──────────────────┘
```

---

## 3. Diccionario de Tablas

### A. Tabla `institutions`
Representa las organizaciones que utilizan la plataforma (ej. SENA, CORHUILA), permitiendo personalizar la interfaz.
* `id` (TEXT, PRIMARY KEY): Identificador único de la institución.
* `code` (TEXT, UNIQUE): Código corto identificador (ej. `'SENA'`, `'CORHUILA'`).
* `name` (TEXT): Nombre completo de la institución.
* `context` (TEXT): Tipo de contexto (ej. `'sena'`, `'university'`).
* `labels` (TEXT): Formato JSON con etiquetas del sistema (ej. `{"role": "Instructor", "unit": "Ficha", "person": "Aprendiz"}`).
* `theme` (TEXT): Colores institucionales en formato JSON (ej. `{"primary": "#39A900", "secondary": "#003049"}`).
* `qr_ttl_minutes` (INTEGER): Tiempo de expiración por defecto de las salas de asistencia (minutos).
* `active` (INTEGER): Define si está activa (1 = Activa, 0 = Inactiva).

### B. Tabla `academic_units`
Representa los grupos o clases (Fichas en el SENA, Materias en CORHUILA).
* `id` (TEXT, PRIMARY KEY): Identificador único de la unidad.
* `institution_id` (TEXT, FOREIGN KEY -> `institutions(id)`).
* `code` (TEXT, UNIQUE): Código del curso o ficha académica.
* `name` (TEXT): Nombre descriptivo.
* `type` (TEXT): Tipo de unidad (ej. `'ficha'`, `'materia'`).
* `active` (INTEGER): Estado del curso.

### C. Tabla `people`
Listado de usuarios registrados en el sistema (Instructores, Estudiantes, Aprendices, Coordinadores).
* `id` (TEXT, PRIMARY KEY): Identificador único de la persona.
* `institution_id` (TEXT, FOREIGN KEY -> `institutions(id)`).
* `documento` (TEXT): Cédula o número de documento de identidad.
* `nombre` (TEXT): Nombre completo.
* `matricula` (TEXT): Código o número de matrícula institucional.
* `active` (INTEGER): Estado de la cuenta.
* `password` (TEXT): Contraseña en texto plano o hash Bcrypt.
* `roles` (TEXT): Array JSON con los roles asignados (ej. `["INSTRUCTOR"]`, `["APRENDIZ"]`, `["COORDINADOR"]`).
* *Restricción de Integridad:* `UNIQUE(institution_id, documento)`.

### D. Tabla `enrollments`
Asocia los aprendices/estudiantes a sus respectivas fichas o materias matriculadas.
* `id` (TEXT, PRIMARY KEY).
* `institution_id` (TEXT, FOREIGN KEY).
* `unit_id` (TEXT, FOREIGN KEY -> `academic_units(id)`).
* `person_id` (TEXT, FOREIGN KEY -> `people(id)`).
* `active` (INTEGER): Estado de la matrícula.
* *Restricción de Integridad:* `UNIQUE(unit_id, person_id)`.

### E. Tabla `attendance_sessions`
Registra las salas de control creadas por los instructores para la toma de asistencia.
* `id` (TEXT, PRIMARY KEY): Código de la sesión (prefijo `sala_`).
* `institution_id` (TEXT, FOREIGN KEY).
* `unit_id` (TEXT, FOREIGN KEY -> `academic_units(id)`).
* `status` (TEXT): Estado de la sesión (`'active'`, `'closed'`).
* `qr_token` (TEXT): Token dinámico actual.
* `qr_expires_at` (TEXT): Fecha ISO de expiración del token QR.
* `qr_ttl_minutes` (INTEGER): Tiempo de expiración inicial.
* `activated_at` (TEXT): Fecha ISO de activación.
* `closed_at` (TEXT): Fecha ISO de clausura.
* `room_created_at` (TEXT): Fecha de creación de la sala.
* `room_expires_at` (TEXT): Fecha límite de vida de la sala.
* `is_reopened` (INTEGER): Indica si la sala fue reabierta temporalmente (1 = Sí, 0 = No).
* `creator_ip` (TEXT): IP del instructor que abrió la sala.
* `ip_check_enabled` (INTEGER): Bandera de validación de IP (1 = Sí, 0 = No).
* `evidence_submitted` (INTEGER): Indica si se subió la foto de evidencia.
* `evidence_submitted_at` (TEXT): Fecha de carga de evidencia.

### F. Tabla `attendance_records`
Bitácora de registros individuales de asistencia de los estudiantes.
* `id` (TEXT, PRIMARY KEY).
* `session_id` (TEXT, FOREIGN KEY -> `attendance_sessions(id)`).
* `institution_id` (TEXT, FOREIGN KEY).
* `unit_id` (TEXT, FOREIGN KEY).
* `person_id` (TEXT, FOREIGN KEY -> `people(id)`).
* `documento` (TEXT): Documento enviado.
* `status` (TEXT): Estado de la asistencia (`'accepted'`, `'rejected'`, `'ASISTENCIA_PARCIAL'`).
* `reject_reason` (TEXT): Motivo del rechazo si aplica.
* `message` (TEXT): Detalles descriptivos del resultado.
* `hora_ingreso_real` (TEXT): Hora formateada (ej. `06:12:05`).
* `hora_salida_real` (TEXT): Hora de salida (si registra reingreso).
* `horas_programadas_sesion` (INTEGER): Total de horas de la clase (defecto: 6).
* `horas_validadas_asistencia` (INTEGER): Horas que se le computan al aprendiz (6h a 0h).
* `horas_inasistencia_acumulada` (INTEGER): Horas de inasistencia (falla acumulada).
* `tipo_registro` (TEXT): Detalle del registro (ej. `'REGULAR'`, `'RETARDO_BLOQUE_1'`, `'MANUAL_OVERRIDE'`).
* `created_at` (TEXT): Fecha de creación.
* `client_ip` (TEXT): Dirección IP de la red del estudiante.

### G. Tabla `excuses`
Almacena justificaciones subidas por aprendices para inasistencias en sesiones pasadas.
* `id` (TEXT, PRIMARY KEY).
* `session_id` (TEXT, FOREIGN KEY).
* `person_id` (TEXT, FOREIGN KEY).
* `text` (TEXT): Justificación del aprendiz.
* `file_name` (TEXT): Nombre de la imagen o archivo PDF.
* `file_data` (TEXT): Datos del documento adjunto (codificado en Base64).
* `status` (TEXT): Estado de la excusa (`'pending'`, `'approved'`, `'rejected'`).
* `created_at` (TEXT).

### H. Tabla `late_requests`
Solicitudes de asistencia tardía por estudiantes que llegaron fuera de rango de sala activa.
* `id` (TEXT, PRIMARY KEY).
* `session_id` (TEXT).
* `institution_id` (TEXT).
* `unit_id` (TEXT).
* `documento` (TEXT).
* `nombre` (TEXT).
* `justification` (TEXT).
* `status` (TEXT): Estado de resolución (`'pending'`, `'resolved'`).
* `horas_descontar` (INTEGER): Horas que se descontarán por tardanza.
* `created_at` (TEXT).

---

## 4. Cálculo de Asistencia Fraccionada (Puntualidad)

La asistencia se calcula aplicando las siguientes reglas:
- **Margen de tolerancia:** Si el estudiante registra dentro de los primeros 15 minutos desde `activated_at`, se le validan **6 horas asistidas** y **0 horas de falla** (Estado: `REGULAR`).
- **Descuento por bloques horarios:** Si se registra posterior al minuto 15, se calcula la diferencia en minutos contra `activated_at`. Cada hora transcurrida o fracción equivale al descuento de un bloque.
  - Ej: Registro al minuto 25 → Retardo de 1 bloque → Asignadas: 5 horas, Fallas: 1 hora, Tipo: `RETARDO_BLOQUE_1`, Estado: `ASISTENCIA_PARCIAL`.
  - Ej: Registro al minuto 70 → Retardo de 2 bloques → Asignadas: 4 horas, Fallas: 2 horas, Tipo: `RETARDO_BLOQUE_2`, Estado: `ASISTENCIA_PARCIAL`.
- **Falla Total:** Si el estudiante no realiza check-in antes de cerrar la sesión, su registro queda como ausente (6 horas de falla, 0 horas asistidas, Tipo: `FALLA_TOTAL`).
