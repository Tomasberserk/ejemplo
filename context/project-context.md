# Contexto del Proyecto

## Objetivo

Aplicación web móvil para la toma de asistencia académica con código QR temporal y código de sala anti-fraude (CSR), usando una arquitectura monolítica ligera con Node.js/Express en el backend, un frontend de página única (SPA) en Vanilla Javascript con Tailwind CSS (vía CDN), y base de datos conmutable SQLite (local) y PostgreSQL (producción).

## Stack Técnico Real

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + Javascript Vanilla + Tailwind CSS (CDN) + html5-qrcode |
| Backend | Node.js (Express) |
| Base de datos | SQLite (Local) / PostgreSQL (Nube) |
| Autenticación | JWT 24h (jsonwebtoken) + bcryptjs |
| Reportes | xlsx (SheetJS) + jsPDF |

## Instituciones

### SENA
- Rol formador: Instructor
- Unidad académica: Ficha
- Persona inscrita: Aprendiz (rol: APRENDIZ)
- Colores: Parametrizados en la base de datos (Verde SENA: `#39A900`).

### CORHUILA / Universidad
- Rol formador: Docente
- Unidad académica: Materia
- Persona inscrita: Estudiante (rol: ESTUDIANTE)
- Colores: Parametrizados en la base de datos.

## Roles disponibles

`ADMIN` · `INSTRUCTOR` · `DOCENTE` · `APRENDIZ` · `ESTUDIANTE` · `COORDINADOR`

Una persona puede tener múltiples roles (JSON Array). Los permisos se calculan por la unión de roles.
El sistema soporta que la misma persona sea INSTRUCTOR en una institución y DOCENTE en otra.

## Flujo de autenticación

1. `POST /api/auth/login` con `{ documento, password }`.
2. Backend busca a la persona activa por documento en la base de datos.
3. Si el password empieza con `$2b$` o `$2a$` → `bcrypt.compare()`; si no → comparación directa en texto plano (entorno de desarrollo/seeds).
4. Respuesta: `{ token (JWT 24h), person { id, institutionId, documento, nombre, roles } }`.
5. Frontend guarda el token en `localStorage`.
6. Todas las rutas `/api/*` (excepto `/api/auth/*` y endpoints de asistencia pública) requieren cabecera `Authorization: Bearer <token>`.

## Sistema anti-fraude CSR (Código de Sala Rotativo)

- El instructor activa la sesión → genera QR + código de sala de 6 caracteres.
- El código rotativo del QR cambia dinámicamente cada 15 segundos en base al ID de la sesión y el timestamp del servidor (`generateQrToken` en `controllers.js`).
- Si la lectura del QR falla, el aprendiz puede ingresar manualmente el código de 6 caracteres que expira y rota en el servidor.
- `POST /attendance/checkin` / `POST /public/attendance/:token/register` → el aprendiz registra asistencia con el código y se valida su IP/subred.

## Usuarios seed de desarrollo

| Nombre | Documento | Password | Rol SENA | Rol CORHUILA |
|--------|-----------|----------|----------|--------------|
| Instructor SENA | 1079606375 | 1079606375 (plano) | INSTRUCTOR | — |
| Docente CORHUILA | 1079606375 | 1079606375 (plano) | — | DOCENTE |
| Jesús González | 0000000001 | qwerty.2026 (bcrypt) | INSTRUCTOR | DOCENTE |
| Coordinador SENA | 9999999999 | coord.2026 (bcrypt) | — | COORDINADOR |
| Aprendiz Tomas | 1077228780 | 1077228780 (plano) | APRENDIZ | — |

**Notas:**
- El instructor SENA y el aprendiz se inicializan con password en texto plano para desarrollo.
- El Coordinador y Jesús González tienen contraseñas encriptadas con bcrypt.

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | *ninguno* | Si está presente, el sistema inicia en modo PostgreSQL. Si no, usa SQLite local. |
| `JWT_SECRET` | `super-secret-key-for-dev-only` | Clave secreta para firmar tokens JWT. |
| `PORT` | `4000` | Puerto en el que corre el servidor Express (API y estáticos). |

## Comandos de Ejecución

El proyecto está diseñado bajo un modelo monolítico simplificado.

```bash
# Instalar dependencias en el backend
npm run install:all

# Iniciar servidor backend y frontend estático en desarrollo
npm run dev

# Arrancar el servidor en producción
npm start
```

## Restricciones

- Sin Docker Compose ni MongoDB Atlas.
- La URL del backend es configurable en runtime en la app del instructor para permitir el uso de túneles locales (ej. ngrok).
- El token QR es opaco e independiente, y se calcula en tiempo de ejecución.
