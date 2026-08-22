# Arquitectura — app-attendance

Este documento describe la arquitectura física y lógica vigente en el proyecto `app-attendance`.

## Topología de ejecución

```
Celular del estudiante
     │ (Escanea QR con cámara o ingresa código manual)
     ▼
Navegador móvil → GET /attendance/{token}          ← Renderiza HTML dinámico de registro
                 POST /public/attendance/{token}/register
                       │
                       ▼
                 API (back/) ── Servidor Express (Puerto 4000)
                       │        Sirve estáticos del Instructor en /
                       │        Maneja lógica de negocio e IP Check
                       │
                 Base de Datos ── SQLite (Local `database.sqlite`) o PostgreSQL (Nube via DATABASE_URL)
```

## Estructura de Capas Real

| Componente | Carpeta | Puerto | Responsabilidad |
|---|---|---|---|
| **Frontend SPA** | `app/` | 4000 (servido estático) | Panel del Instructor y Coordinador. SPA en HTML/JS con Tailwind CDN. |
| **Backend REST API** | `back/` | 4000 | Expone endpoints, gestiona JWT, calcula puntualidad y valida tokens QR. |
| **Persistencia** | `back/database.sqlite` / `PostgreSQL` | - | Tablas relacionales inicializadas automáticamente al arrancar. |

## Flujo de Autenticación

```
App SPA (Instructor) ── POST /api/auth/login {documento, password} ──> API Express
                     <── Retorna JWT (24h) + datos del usuario ─────── API Express

Todas las peticiones a /api/* adjuntan cabecera Authorization: Bearer <JWT>
```

## Flujo de Sesión de Asistencia

```
1. Instructor ── POST /room/create ────────────> Abre sala de 15 minutos en estado activo.
2. Instructor ── Muestra QR rotativo ───────────> QR apunta a /attendance/{token}. El token rota cada 15s.
3. Estudiante ── Abre URL y manda check-in ────> POST /public/attendance/{token}/register con clave.
4. Backend    ── Valida subred IP y horario ───> Modifica tabla de asistencias asignando horas (6h a 0h).
5. Instructor ── Polling cada 5 segundos ───────> GET /api/sessions/{id}/present para actualizar la grilla.
6. Instructor ── POST /api/sessions/{id}/close ──> Cierra la sesión permanentemente.
```

## Restricciones y Decisiones de Diseño

- **Monolito de despliegue simple:** El frontend y el backend se ejecutan sobre el mismo proceso de Node.js, reduciendo la complejidad del despliegue en plataformas en la nube (ej. Vercel).
- **Base de Datos Conmutable:** Permite desarrollo local ágil sin instalar motores de base de datos pesados (SQLite) y despliegue robusto en producción (PostgreSQL) usando la misma interfaz de consulta simple en `db.js`.
- **Desacoplamiento de Estilos:** Se utiliza Tailwind CSS cargado por CDN para dar un aspecto estético premium (oscuro con tonos verdes SENA) de manera ligera sin requerir herramientas de empaquetado complejas en desarrollo.
