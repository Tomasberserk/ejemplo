# ADR 003: Reorganización Estructural y Principio Anti-Sobreingeniería (Monolito Modular Ligero)

- **Fecha:** 2026-08-22
- **Estado:** Aceptado
- **Líder y Compilador:** Desarrollador 3 (Database, Gobernanza, Testing & Coordinación de Docs)
- **Colaboradores:** Desarrollador 1 (Frontend & UX), Desarrollador 2 (Backend & Security), Desarrollador 3 (Database & QA)

---

## 1. Contexto del Problema

El sistema de control de asistencia del SENA (`sena-attendance-system`) requiere operar en aulas y laboratorios de formación donde la conectividad a internet puede ser intermitente, los dispositivos de los aprendices presentan diversas especificaciones de hardware y el tiempo de despliegue/mantenimiento debe ser mínimo.

En proyectos educativos y plataformas de control de asistencia es frecuente caer en la **sobreingeniería (overengineering)**: adoptar microservicios distribuidos, contenedores orquestados con Kubernetes, colas de mensajería asíncronas (Kafka/RabbitMQ) y frameworks de frontend de alto consumo de compilación (Next.js/Angular) que encarecen el hosting, dificultan la depuración local y ralentizan la adopción por parte de los estudiantes.

---

## 2. Decisión Arquitectónica: Monolito Modular Ligero

Se decide estructurar el sistema bajo una arquitectura de **Monolito Modular Ligero (Lightweight Modular Monolith)**, centralizado en Node.js/Express, con separación canónica de responsabilidades, persistencia portable y frontend desacoplado pero servido de forma unificada.

```
┌──────────────────────────────────────────────────────────────────┐
│                   SENA ATTENDANCE SYSTEM                         │
├────────────────────────┬────────────────────────┬────────────────┤
│   Módulo 1: Frontend   │   Módulo 2: Backend    │  Módulo 3: DB  │
│   (Desarrollador 1)    │   (Desarrollador 2)    │ (Desarrollador 3)
├────────────────────────┼────────────────────────┼────────────────┤
│ • SPA Vanilla JS       │ • Express 5 REST API   │ • SQLite3/Pg   │
│ • Tailwind CSS (CDN)   │ • Auth JWT (Roles)     │ • Schema DDL   │
│ • html5-qrcode         │ • Rotación HMAC (15s)  │ • Seeds canónicos
│ • Face-API Biometría   │ • Subred / IP Match    │ • Buffer Local │
│ • Offline Queue UI     │ • Salud (/health)      │ • Tests Suite  │
└────────────────────────┴────────────────────────┴────────────────┘
```

---

## 3. Aportes Técnicos Consolidados por Desarrollador

### A. Perspectiva del Desarrollador 1 (Frontend, UX & Flujo del Aprendiz)
* **SPA Ligera sin Compilación:** Implementación con HTML5 semántico, JavaScript Vanilla moderno y estilos utilitarios con Tailwind CSS vía CDN. Esto elimina la necesidad de herramientas de empaquetado como Webpack o Vite para el cliente básico.
* **Captura QR y Biometría Facial en Cliente:** Integración de `html5-qrcode` para lectura rápida de cámaras y `Face-API.js` para validación facial local en el navegador del aprendiz, reduciendo la carga de procesamiento del servidor.
* **Buffer Offline (Resiliencia en Aula):** Encolamiento automático de marcaciones en `localStorage` cuando se pierde la conexión a internet, sincronizándose de forma transparente al restablecer la red (`online` event).

### B. Perspectiva del Desarrollador 2 (Backend, API REST & Seguridad)
* **Control Centralizado de Sesiones:** Endpoints REST organizados en controladores específicos (`controllers.js`) para autenticación por roles (`INSTRUCTOR`, `APRENDIZ`, `COORDINADOR`).
* **Seguridad Dinámica de QR (HMAC + Leeway):** Algoritmo de rotación de tokens QR cada 15 segundos con tolerancia (leeway) de hasta 5 minutos en el backend para absorber latencias de red móvil sin comprometer la seguridad física del aula.
* **Mitigación de Registro Remoto:** Validación de subred IP entre el docente y el aprendiz para garantizar que los registros ocurran dentro de la red local del centro de formación.

### C. Perspectiva del Desarrollador 3 (Database, Gobernanza, Testing & Coordinación)
* **Persistencia Relacional Portable:** Diseño de base de datos canónico conmutativo (`SQLite3` para desarrollo local y pruebas instantáneas; `PostgreSQL` para entornos de producción en la nube mediante variable `DATABASE_URL`).
* **DDL y DML Canónicos:** Extracción y versionamiento de `database/schema.sql` y `database/seeds.sql`.
* **Gobernanza y Estrategia de Ramas:** Documento rector en `docs/governance/repository-governance.md` con Conventional Commits y aislamiento de carpetas.
* **Testing Automatizado:** Suite de pruebas unitarias y de integración en `backend/tests/` que valida el cálculo proporcional de horas por puntualidad, la rotación de tokens y los endpoints de salud (`/health`, `/ready`).

---

## 4. Análisis Anti-Sobreingeniería (¿Por qué NO otras alternativas?)

| Alternativa Rechazada | Motivo del Rechazo | Solución Adoptada en su Lugar |
| :--- | :--- | :--- |
| **Microservicios con Docker/K8s** | Alto consumo de RAM en PCs educativas; complejidad de orquestación innecesaria para la escala del SENA. | Proceso único de Node.js portable en cualquier PC o servidor ligero. |
| **Bases de Datos NoSQL (MongoDB)** | Ausencia de integridad referencial nativa para matrículas, asistencias y fichas; inconsistencias en reportes. | Esquema Relacional SQL estricto con Foreign Keys y Cascades. |
| **Frameworks SSR Pesados (Next/Nuxt)**| Ciclos de compilación lentos; dependencia de Node en tiempo de renderizado de interfaz. | SPA Estática + Server-rendered QR portal servido desde Express. |
| **Message Brokers (Kafka/RabbitMQ)** | Infraestructura redundante para colas de asistencia de 30-40 aprendices por salón. | Cola cliente en `localStorage` + procesamiento directo transaccional en SQLite/Postgres. |

---

## 5. Consecuencias y Beneficios

* **Instalación en un solo comando:** Cualquier instructor o aprendiz puede clonar el repositorio y ejecutar `npm run install:all && npm start`.
* **Despliegue Cero-Fricción:** Compatible al 100% con Vercel, Render o servidores locales del centro sin modificaciones en el código fuente.
* **Auditoría Clara:** Documentación unificada bajo `docs/` y trazabilidad histórica mediante Conventional Commits.
