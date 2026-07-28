# Plan de Implementación

Este plan describe la hoja de ruta seguida para la puesta en marcha, validación y despliegue del sistema monolítico de asistencia académica (`app-attendance`).

---

## Fase 1: Estructuración y Base del Repositorio

- [x] Organizar las carpetas principales del proyecto monolítico en `back/` (API y base de datos) y `app/` (SPA del instructor/coordinador).
- [x] Crear el archivo `package.json` en la raíz para orquestar la instalación de dependencias y scripts globales de desarrollo.
- [x] Configurar el archivo de variables de entorno `.env` en el backend para control de puertos e inyección de base de datos Postgres opcional.

---

## Fase 2: Lógica de Persistencia Relacional y Adaptador de Base de Datos

- [x] Diseñar el módulo `back/src/db.js` para conmutar dinámicamente entre SQLite (archivo local) y PostgreSQL (producción).
- [x] Escribir el script de creación de tablas relacionales (`initDb`) y migración automática de columnas para soporte de peticiones y justificaciones.
- [x] Crear un sembrado de datos (seeding) inicial para tener cargada la institución SENA y los usuarios de desarrollo listos para validar flujos inmediatamente.

---

## Fase 3: Desarrollo de endpoints de negocio (Express API)

- [x] Implementar rutas públicas de autenticación JWT y registro de asistencia.
- [x] Desarrollar la lógica de cálculo de puntualidad (horas asistidas completas, parciales y fallas por bloques).
- [x] Crear los endpoints del coordinador para gestionar instructores y fichas.
- [x] Integrar el middleware de control de subred e IP para mitigar fraudes por compartición de enlaces.

---

## Fase 4: Frontend Monolítico SPA y Portal Móvil

- [x] Diseñar la SPA del instructor en un archivo HTML único con estilos cargados desde CDN Tailwind CSS.
- [x] Desarrollar el script `app/app.js` para manejar el login, control de salas, polling de actualización en tiempo real y descarga de informes Excel (xlsx) y PDF.
- [x] Implementar la generación dinámica de la página del aprendiz en el backend bajo `/attendance/:token` para eliminar la necesidad de un build móvil en esta etapa.

---

## Fase 5: Validación Técnica y Documentación

- [x] Escribir un script de prueba de integración de endpoints locales (`back/test-integration.js`).
- [x] Documentar el modelo de datos relacional físico.
- [x] Validar los escenarios funcionales críticos del instructor y el aprendiz.
