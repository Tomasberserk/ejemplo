# Contrato API

Base local:

```text
http://localhost:4000
```

La app debe usar la URL configurada por el usuario. En clase normalmente sera la URL publica del tunel.

## Convenciones

- Formato: REST JSON.
- **Autenticacion**: JWT Bearer token requerido en todas las rutas `/api/*` salvo `/api/auth/*`.
  - Header: `Authorization: Bearer <token>`
  - Errores sin token o token invalido: `401 UNAUTHORIZED`
- Errores:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La solicitud no cumple el contrato esperado.",
    "details": [],
    "trace_id": "uuid"
  }
}
```

## Autenticacion

### `POST /api/auth/login` — **publico**

Autentica un formador (ADMIN, INSTRUCTOR, DOCENTE).

Request:

```json
{
  "documento": "1079606375",
  "password": "1079606375"
}
```

Response `200`:

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "person": {
      "id": "...",
      "institutionId": "...",
      "nombre": "NOMBRE APELLIDO",
      "documento": "1079606375",
      "roles": ["INSTRUCTOR"]
    }
  }
}
```

Errores relevantes:

- `INVALID_CREDENTIALS` (401) — documento no existe, no es formador, o contraseña incorrecta.

## Salud

### `GET /health`

Valida que el proceso API responde.

### `GET /ready`

Valida que la API puede consultar MongoDB.

## Catalogos — **requieren Auth**

### `GET /api/institutions`

Lista instituciones activas.

### `GET /api/institutions/{institutionId}/units`

Lista fichas o materias de la institucion.

### `GET /api/units/{unitId}/people`

Lista aprendices o estudiantes inscritos en la ficha/materia.

## Sesiones — **requieren Auth**

### `POST /api/sessions`

Crea sesion en estado `draft`.

Request:

```json
{
  "institutionId": "ObjectId",
  "unitId": "ObjectId",
  "qrTtlMinutes": 10
}
```

Errores relevantes:

- `INSTITUTION_NOT_FOUND`
- `UNIT_INSTITUTION_MISMATCH`
- `UNIT_EMPTY`

### `POST /api/sessions/{sessionId}/activate`

Activa la sesion y genera `qrToken`, `qrExpiresAt` y `attendanceUrl`.

### `POST /api/sessions/{sessionId}/close`

Cierra la sesion. Despues del cierre no se aceptan registros.

### `GET /api/sessions/{sessionId}`

Consulta estado, conteos y URL de asistencia si existe.

### `GET /api/sessions`

Historial basico. Query params opcionales:

- `institutionId`
- `unitId`
- `limit`

### `GET /api/sessions/{sessionId}/present`

Lista registros aceptados.

### `GET /api/sessions/{sessionId}/absent`

Calcula inscritos sin registro aceptado.

### `GET /api/sessions/{sessionId}/rejections`

Lista intentos rechazados, incluyendo duplicados.

## QR publico — **sin Auth**

### `GET /attendance/{token}`

Pagina HTML publica para registrar documento.

### `POST /public/attendance/{token}/register`

Request form o JSON:

```json
{
  "documento": "1001001001"
}
```

Validaciones:

- Sesion inexistente.
- Sesion no activa.
- Sesion cerrada.
- QR expirado.
- Documento no encontrado.
- Documento de otra ficha/materia.
- Documento duplicado.
- IP de petición fuera de subred del docente.

---

## Nuevos Endpoints de Sala y Asistencia Fraccionada (MVP)

### `POST /room/create`
Crea una sala de asistencia y activa un cronómetro en el servidor por exactamente 15 minutos.
Response `201` con los datos de la sala/sesión creada.

### `POST /room/reopen`
Reabre la sala cerrada por otros 15 minutos para registrar la salida.
Request:
```json
{
  "sessionId": "sala_sado_289123"
}
```

### `POST /attendance/checkin`
Registra la entrada o salida del aprendiz. Verifica la firma del QR (rotado cada 15 segundos) y que la IP del cliente esté en el mismo rango de red/subred que la IP de creación de la sala.

Request:
```json
{
  "documento": "1079606375",
  "qrToken": "xyz_15s_token"
}
```

Response `200` con la estructura de la asistencia:
```json
{
  "id_asistencia": "ast_99281",
  "id_estudiante": "est_102",
  "id_sala": "sala_sado_289123",
  "fecha": "2026-07-11",
  "hora_ingreso_real": "06:16:22",
  "hora_salida_real": "12:01:05",
  "horas_programadas_sesion": 6,
  "horas_validadas_asistencia": 5,
  "horas_inasistencia_acumulada": 1,
  "tipo_registro": "RETARDO_BLOQUE_1"
}
```

### `POST /attendance/manual-override`
Permite al docente corregir la asistencia de un aprendiz de forma manual (justificar retardo o inasistencia).
Request:
```json
{
  "sessionId": "sala_sado_289123",
  "documento": "1079606375",
  "horas_validadas_asistencia": 6,
  "horas_inasistencia_acumulada": 0,
  "tipo_registro": "MANUAL_OVERRIDE"
}
```

### `GET /reports/session/{sessionId}`
Genera un reporte resumido de la sesión de asistencia con el balance exacto de cada estudiante/aprendiz.
Response `200`:
```json
[
  {
    "documento": "1079606375",
    "nombre": "APRENDIZ EJEMPLO",
    "horas_programadas": 6,
    "horas_asistidas": 5,
    "horas_falla": 1,
    "porcentaje_asistencia": 83.33,
    "tipo_registro": "RETARDO_BLOQUE_1"
  }
]
```


