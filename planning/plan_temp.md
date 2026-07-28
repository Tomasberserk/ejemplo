# Matriz de Ejecución Real - App Attendance

Este documento registra el contrato de ejecución del desarrollo del proyecto monolítico. Cada tarea descrita aquí se encuentra validada y se ha marcado como `[x]` al cumplir con sus criterios de aceptación específicos en el stack Node/SQLite/Tailwind actual.

---

## 🟢 Fase 0: Estructuración y Configuración Base (DX)
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Estructura de Proyecto | Creación de carpetas `app/` (SPA frontend) y `back/` (API Express). | Carpetas físicas creadas |
| [x] | Orquestación Raíz | `package.json` en raíz con comando `install:all` y `dev`. | Archivo `package.json` en raíz |
| [x] | Dependencias Backend | Instalación de `express`, `cors`, `sqlite3`, `pg`, `bcryptjs` y `jsonwebtoken`. | `back/package.json` |

---

## 🔵 Fase 1: Persistencia y Adaptador Conmutable
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Adaptador de Datos | Conmutación dinámica SQLite/Postgres basada en variable `DATABASE_URL`. | `back/src/db.js` |
| [x] | Definición de Tablas | Inicialización automática del esquema físico relacional en el arranque. | Método `initDb` en `db.js` |
| [x] | Sembrado de Datos | Carga automática idempotente de instituciones, fichas y usuarios demo. | Datos semilla inicializados |
| [x] | Limpieza de Estudiantes | Limpieza de la tabla `people` para dejar únicamente al aprendiz Tomas Berserk. | Registro en consola en el inicio |

---

## 🟡 Fase 2: Desarrollo Backend API
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Autenticación JWT | Login multirrol con soporte para texto plano y encriptación Bcrypt. | `back/src/auth.js` |
| [x] | Ciclo de Sala | Endpoints para crear sala, activar, cerrar y reabrir por 15 min. | Endpoints `/room/*` y `/api/sessions/*` |
| [x] | Control Anti-fraude | Token QR rotativo calculado en bloques de 15 segundos y chequeo de subred IP. | Métodos `generateQrToken` y `checkSameSubnetOrIp` |
| [x] | Justificaciones | Carga de excusas en base64 y bandeja de entrada de resoluciones del docente. | Métodos de resolución en `controllers.js` |

---

## 🟠 Fase 3: SPA Frontend (Instructor & Coordinador)
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Vista Monolítica | SPA en HTML5 estructurada en div condicionales utilizando Tailwind CSS. | `app/index.html` |
| [x] | Lógica de Control | Gestión de estado, conmutación de pestañas y peticiones API. | `app/app.js` |
| [x] | Lectura QR | Integración de escaneo de cámara mediante librería `html5-qrcode` por CDN. | `Html5Qrcode` inicializado en app.js |
| [x] | Descarga de Informes | Exportación directa a plantillas Excel estructuradas usando SheetJS (XLSX). | Evento `btnPrintReport` con SheetJS |
| [x] | Dashboard Coordinación| Vistas para crear/editar instructores, fichas y auditar evidencias. | Pestañas de coordinación en SPA |

---

## 🔴 Fase 4: Portal Móvil del Estudiante
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Vista Dinámica SSR | Página única autogenerada por el backend en la ruta `/attendance/:token`. | Plantilla HTML inyectada en server.js |
| [x] | Formulario Paso a Paso| Flujo de ingreso: Chequeo -> Clave -> Confirmación o Retraso Tardío. | JS embebido en la respuesta del server |

---

## 🟣 Fase 5: Validación General
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Tests de Integración | Script `test-integration.js` valida el ciclo completo sin dependencias externas.| Ejecución exitosa de `test-integration.js` |
| [x] | Chequeo de endpoints | Endpoints `/health` y `/ready` responden códigos de éxito en el puerto 4000. | Comando HTTP local responde PASS |