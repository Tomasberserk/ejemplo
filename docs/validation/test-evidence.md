# Evidencia de Validación

Fecha: 2026-07-25

Este documento recopila las pruebas de integración y validaciones funcionales ejecutadas sobre el stack monolítico real de la aplicación (Node.js Express + SQLite).

## Pruebas de Integración Ejecutadas

Se ejecutó el script de integración `back/test-integration.js` de forma local sobre la API en ejecución en el puerto 4000:

| Paso de Prueba | Entrada de Datos | Resultado | Detalle / Observación |
|---|---|---|---|
| 1. Chequeo de Salud | `GET /health` | **PASS** | Responde `'ok'` con código HTTP `200`. |
| 2. Autenticación Formador | `POST /api/auth/login` | **PASS** | Se autentica al Instructor SENA `1079606375` y se recibe el JWT. |
| 3. Creación de Sala | `POST /room/create` | **PASS** | Crea sesión activa para la ficha `2503399` con ID autogenerado. |
| 4. Obtención de QR Token | `GET /api/sessions/{id}/qr-token` | **PASS** | El backend genera y retorna el token QR rotativo actual. |
| 4b. Verificación de Tolerancia QR | `POST /attendance/checkin` | **PASS** | Se valida la tolerancia de 5 minutos sobre tokens generados previamente. |
| 5. Registro de Asistencia Regular | `POST /attendance/checkin` | **PASS** | Se marca presente a un estudiante con credenciales válidas y en hora regular. |
| 6. Registro Fuera de Subred | `POST /attendance/checkin` | **PASS** | El sistema detecta y rechaza intentos si el cliente reporta IP externa. |
| 7. Cierre de Sala | `POST /api/sessions/{id}/close` | **PASS** | Clausura el registro y rechaza nuevos ingresos. |

---

## Verificación de Datos Sembrados (SQLite)

Al iniciar el servidor en modo desarrollo (`npm run dev`), la base de datos se inicializa en `back/database.sqlite` y el seed inyecta los siguientes datos iniciales:

- **Instituciones:** 1 Activa (`SENA` con etiquetas "Instructor", "Ficha", "Aprendiz" y paleta `#39A900`).
- **Unidades Académicas:** 2 Fichas activas (`3413974` - ADSO y `2503400` - Gestión de Redes).
- **Usuarios de Prueba:**
  - Instructor Jesús González (`0000000001`, encriptado con Bcrypt).
  - Instructor SENA (`1079606375`, texto plano para desarrollo).
  - Coordinador SENA (`9999999999`, encriptado con Bcrypt).
  - Aprendiz Tomas Berserk (`1077228780`, texto plano).
- **Matrículas (Enrollments):** Tomas Berserk queda asignado a la ficha de ADSO (`3413974`).

---

## Evidencia de Consola del Servidor

Salida típica del servidor backend al inicializar la base de datos de manera exitosa:

```text
Database type: SQLite (Local) at: C:\Users\merid\Downloads\ejemplo\back\database.sqlite
Database Init: Student list cleaned successfully (Tomas Berserk kept).
Backend server running at http://localhost:4000
```
