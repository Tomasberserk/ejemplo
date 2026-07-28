# Contrato de la API REST

Este documento define las rutas, parámetros y respuestas estructuradas provistas por el servidor backend del sistema de asistencia académica.

Base local por defecto:
```text
http://localhost:4000
```

---

## 1. Convenciones y Manejo de Errores

* **Formato de Comunicación:** Todas las peticiones y respuestas utilizan formato `application/json`.
* **Autenticación:** Las rutas protegidas `/api/*` requieren cabecera HTTP `Authorization: Bearer <token_jwt>`. Las rutas bajo `/public/*`, `/health`, `/ready` y `/attendance/*` son de libre acceso.
* **Respuestas de Error:** En caso de falla, se retorna una estructura estándar con código de estado HTTP correspondiente y un objeto error en el cuerpo:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Mensaje informativo de lo que falló."
    }
  }
  ```

---

## 2. Endpoints Públicos de Autenticación y Salud

### A. Iniciar Sesión (`POST /api/auth/login`)
Valida credenciales de instructores, coordinadores y estudiantes.
* **Cuerpo de Petición:**
  ```json
  {
    "documento": "1079606375",
    "password": "mi_password_secreta"
  }
  ```
* **Respuesta de Éxito (`200 OK`):**
  ```json
  {
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "person": {
        "id": "per_inst_1",
        "institutionId": "inst_sena_1",
        "nombre": "Instructor SENA",
        "documento": "1079606375",
        "roles": ["INSTRUCTOR"]
      }
    }
  }
  ```

### B. Salud del Servidor (`GET /health`)
Verifica que el servidor Express está activo. Responde con texto plano `'ok'`.

### C. Conexión de Persistencia (`GET /ready`)
Verifica la conexión saludable con la base de datos relacional (SQLite o PostgreSQL). Responde con texto plano `'ready'`.

---

## 3. Endpoints de Catálogos (Requieren Auth)

### A. Obtener Instituciones (`GET /api/institutions`)
Retorna la lista de instituciones registradas activas.

### B. Obtener Unidades de Institución (`GET /api/institutions/:institutionId/units`)
Retorna materias o fichas asociadas a la institución.

### C. Obtener Personas de Unidad (`GET /api/units/:unitId/people`)
Lista aprendices matriculados asignados al grupo académico.

---

## 4. Gestión de Salas y Asistencias (Requieren Auth - Instructor)

### A. Crear Sala de Asistencia (`POST /room/create`)
Crea la sesión de clase, asignando un código inicial dinámico y activando el cronómetro de asistencia por 15 minutos en el servidor.
* **Cuerpo de Petición:**
  ```json
  {
    "institutionId": "inst_sena_1",
    "unitId": "unit_ficha_3413974",
    "qrTtlMinutes": 15,
    "ipCheckEnabled": true
  }
  ```
* **Respuesta (`201 Created`):** Retorna el objeto completo de la sesión creada en `data`.

### B. Reabrir Sala Cerrada (`POST /room/reopen`)
Reabre una sala cerrada por otros 15 minutos para admitir ingresos de salida.
* **Cuerpo de Petición:**
  ```json
  {
    "sessionId": "sala_171501293"
  }
  ```

### C. Cerrar Sesión Manual (`POST /api/sessions/:sessionId/close`)
Cierra definitivamente el registro de asistencias de la jornada.

### D. Obtener Token QR Dinámico (`GET /api/sessions/:sessionId/qr-token`)
Retorna el token QR rotativo actual de 12 caracteres calculado en base al bloque de 15 segundos actual.

### E. Listar Asistencias de la Sesión (`GET /api/sessions/:sessionId/present`)
Lista los estudiantes presentes de la sesión indicando horas y tipo de registro.

### F. Listar Estudiantes Ausentes (`GET /api/sessions/:sessionId/absent`)
Lista los estudiantes matriculados que no registran asistencia.

### G. Listar Intentos Rechazados (`GET /api/sessions/:sessionId/rejections`)
Historial de reintentos fallidos, duplicados e intentos fuera de subred.

### H. Modificación Manual de Asistencia (`POST /attendance/manual-override`)
Permite al docente corregir de forma manual las horas y el estado de asistencia de un estudiante.
* **Cuerpo de Petición:**
  ```json
  {
    "sessionId": "sala_171501293",
    "documento": "1077228780",
    "horas_validadas_asistencia": 6,
    "horas_inasistencia_acumulada": 0,
    "tipo_registro": "MANUAL_OVERRIDE"
  }
  ```

### I. Carga Manual Externa de Asistencia (`POST /attendance/manual-checkin`)
Inserta directamente una asistencia tardía desde el panel docente.

### J. Carga de Evidencia Fotográfica (`POST /api/sessions/:sessionId/evidence`)
Permite al docente adjuntar una foto de soporte del aula de clase.

---

## 5. Portal Público Estudiante (Sin Auth - Libre)

### A. Chequeo de Documento en Sesión (`POST /public/attendance/:token/check-document`)
Verifica si el documento está registrado y pertenece a la ficha asociada a la sesión de asistencia representada por el QR token.
* **Cuerpo de Petición:**
  ```json
  {
    "documento": "1077228780"
  }
  ```

### B. Registro de Asistencia Regular (`POST /public/attendance/:token/register`)
Marca la asistencia de un aprendiz con validación de clave de acceso.
* **Cuerpo de Petición:**
  ```json
  {
    "documento": "1077228780",
    "password": "mi_clave_aprendiz"
  }
  ```

### C. Autoregistro Estudiante Nuevo (`POST /public/attendance/:token/self-register`)
Registra a un estudiante por primera vez en la base de datos y le marca su asistencia.
* **Cuerpo de Petición:**
  ```json
  {
    "documento": "1088229910",
    "nombre": "Carlos Restrepo",
    "password": "clave_segura_aprendiz"
  }
  ```

### D. Envío de Petición por Tardanza (`POST /public/attendance/:token/late-request`)
Carga una solicitud para que el instructor autorice su asistencia si llegó después del cierre.
* **Cuerpo de Petición:**
  ```json
  {
    "documento": "1077228780",
    "nombre": "Tomas Berserk",
    "justification": "Cita médica"
  }
  ```
