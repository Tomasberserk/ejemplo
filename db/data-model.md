# Modelo de Datos MongoDB

## Alcance

Soporta asistencia academica para SENA y CORHUILA/Universidad con QR temporal, sin autenticacion y con datos precargados desde `db/source/seed_asistencia_corhuila_sena_mongo_local.json`.

## Glosario

| Termino | Definicion | Traduccion tecnica |
|---|---|---|
| Institucion | SENA o CORHUILA/Universidad | `institutions` |
| Ficha | Agrupacion academica SENA | `academic_units.type = ficha` |
| Materia | Agrupacion academica universidad | `academic_units.type = materia` |
| Aprendiz/Estudiante | Persona inscrita | `people` + `enrollments` |
| Sesion de asistencia | Evento temporal abierto por instructor/docente | `attendance_sessions` |
| Registro | Intento de marcar asistencia | `attendance_records` |

## Colecciones

### `institutions`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `code` | string | Si | Selector estable: SENA, CORHUILA |
| `name` | string | Si | Nombre visible |
| `context` | enum | Si | Diferencia `sena` y `university` |
| `labels` | object | Si | Rol y nombres por institucion |
| `theme` | object | Si | Visual parametrizable sin asumir colores oficiales |
| `qr.ttlMinutes` | number | Si | TTL por defecto |
| `active` | boolean | Si | Filtrado operativo |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `academic_units`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `institutionId` | ObjectId | Si | Pertenece a institucion |
| `code` | string | Si | Codigo de ficha o materia |
| `name` | string | Si | Nombre visible |
| `type` | enum | Si | `ficha` o `materia` |
| `active` | boolean | Si | Filtrado operativo |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `people`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `institutionId` | ObjectId | Si | Evita mezcla entre instituciones |
| `documento` | string | Si | Dato visible y llave de registro desde QR |
| `nombre` | string | Si | Dato visible |
| `matricula` | string | Si | Dato visible institucional |
| `active` | boolean | Si | Permite desactivar sin borrar |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `enrollments`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `institutionId` | ObjectId | Si | Consulta por institucion |
| `unitId` | ObjectId | Si | Ficha o materia |
| `personId` | ObjectId | Si | Persona inscrita |
| `active` | boolean | Si | Retiro o inactivacion |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `attendance_sessions`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `institutionId` | ObjectId | Si | Validacion de contexto |
| `unitId` | ObjectId | Si | Ficha o materia tomada |
| `status` | enum | Si | `draft`, `active`, `closed`, `expired` |
| `qrToken` | string | No | Token publico del QR, no contiene datos sensibles |
| `qrExpiresAt` | date | No | Expiracion del QR |
| `qrTtlMinutes` | number | Si | Minutos configurados |
| `activatedAt` | date | No | Auditoria de activacion |
| `closedAt` | date | No | Auditoria de cierre |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `attendance_records`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | string/ObjectId | Si | Identidad interna |
| `sessionId` | string/ObjectId | Si | Sesion evaluada |
| `institutionId` | string/ObjectId | Si | Contexto de validacion |
| `unitId` | string/ObjectId | Si | Ficha evaluada |
| `personId` | string/ObjectId | No | Nulo en documento no encontrado |
| `documento` | string | Si | Documento enviado desde QR |
| `status` | enum | Si | `accepted`, `rejected`, `ASISTENCIA_PARCIAL` o `PRESENTE` |
| `rejectReason` | enum | No | Motivo de rechazo (ej. `EXPIRED_QR`, `OUT_OF_SUBNET`, etc.) |
| `message` | string | Si | Mensaje legible |
| `hora_ingreso_real` | string | No | Hora de check-in (HH:MM:SS) |
| `hora_salida_real` | string | No | Hora de check-out (HH:MM:SS) |
| `horas_programadas_sesion` | number | Si | Total de horas de la sesión (ej. 6) |
| `horas_validadas_asistencia` | number | Si | Horas asistidas calculadas (ej. 5 o 6) |
| `horas_inasistencia_acumulada` | number | Si | Horas de falla acumuladas (ej. 1) |
| `tipo_registro` | string | Si | Tipo de registro (ej. `REGULAR`, `RETARDO_BLOQUE_1`, `MANUAL_OVERRIDE`) |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### Estructura de Asistencia Fraccionada (No Binaria)

En el MVP, la asistencia no es un valor booleano (Presente/Ausente). Se implementa un modelo de **Asistencia Fraccionada por Bloques Horarios**:

- **Ventana de Puntualidad (0 a 15 min)**: Si se registra entrada entre las 06:00 y las 06:15, se otorgan 100% de horas (`horas_validadas_asistencia = 6`, `horas_inasistencia_acumulada = 0`).
- **Cálculo de Retardo por Bloque**: Si se registra entrada después de las 06:15 (ej. a las 06:16), se descuenta el primer bloque horario completo de 1 hora. Se registra como `horas_validadas_asistencia = 5`, `horas_inasistencia_acumulada = 1`, `tipo_registro = 'RETARDO_BLOQUE_1'` y estado `ASISTENCIA_PARCIAL`.

Ejemplo de JSON guardado en base de datos:
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

## Indices

- `institutions.code` unico.
- `academic_units.institutionId + code` unico.
- `people.institutionId + documento` unico.
- `enrollments.unitId + personId` unico.
- `attendance_sessions.qrToken` unico sparse.
- `attendance_records.sessionId + personId + status` unico parcial para `accepted`.

## Fuente real cargada

El seed oficial toma como entrada `db/source/seed_asistencia_corhuila_sena_mongo_local.json`.

Resumen de la fuente:

- 2 instituciones: SENA y CORHUILA.
- 6 materias CORHUILA.
- 3 fichas SENA.
- 265 filas de personas inscritas.
- 253 personas unicas por institucion/documento.

Las personas duplicadas por documento dentro de una misma institucion se conservan como una sola persona y se relacionan con varias materias mediante `enrollments`.
