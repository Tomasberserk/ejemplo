# ADR 003: Reestructuración Modular y Eliminación de Sobreingeniería

- **Fecha:** 2026-08-22
- **Estado:** Aceptado
- **Autores:** Equipo de Desarrollo SENA (Dev 1: Frontend & UX, Dev 2: Backend & Security, Dev 3: Governance & DB)

---

## 1. Contexto y Diagnóstico del Problema

Durante las sesiones reales de prueba en el aula y la evaluación de ingeniería inversa ([`docs/academic/INGENIERIA_INVERSA.md`](file:///c:/Users/merid/Downloads/ejemplo/docs/academic/INGENIERIA_INVERSA.md)), se identificaron varios casos de **sobreingeniería y fricción operativa** que ralentizaban la toma de asistencia y causaban bloqueos injustificados a estudiantes honestos:

1. **Reconocimiento Facial Hiperestricto en Navegador (`face-api.js`):** La descarga y ejecución de redes neuronales pesadas en celulares de gama de entrada saturaba la memoria y fallaba ante condiciones de iluminación del aula, impidiendo que el alumno completara el check-in.
2. **Validación de Subred IP Rígida:** Se asumía que todos los aprendices se conectarían a la red Wi-Fi institucional del aula. En la práctica, muchos aprendices utilizan sus datos móviles personales (4G/5G), recibiendo rechazos inmediatos por discrepancia de IP pública.
3. **Rotación Excesivamente Rápida del Token QR (15 segundos):** La latencia de red en combinación con el tiempo de enfoque de las cámaras generaba solicitudes con tokens expirados antes de llegar al servidor.
4. **Estructura Desordenada del Repositorio:** Existían carpetas dispersas (`app/`, `back/`, `db/`, `decisions/`, `ui-ux/`, etc.) sin una clara separación de responsabilidades ni gobernanza para el trabajo en equipo.

---

## 2. Decisiones Arquitectónicas Adoptadas

### A. Reorganización Canónica en 4 Áreas Principales
Se consolida el monorepo en exactamente 4 carpetas con fronteras de responsabilidad estrictas:
* `frontend/`: SPA y vistas móviles en Vanilla JS y Tailwind CDN.
* `backend/`: API REST Node.js/Express, autenticación y persistencia conmutable.
* `database/`: Modelos y scripts canónicos SQL (`schema.sql`, `seeds.sql`).
* `docs/`: Documentación integral unificada (gobernanza, arquitectura, ADRs, UI/UX, seguridad, validación y entregables académicos).

### B. Flexibilización de la Biometría Facial (Soft-Validation & Fallback)
* Se reduce el umbral de coincidencia a un permisivo 45%.
* Si el modelo facial tarda más de 15 segundos o no detecta rostro por iluminación, se desbloquea automáticamente el botón de confirmación manual con código de 6 caracteres.
* El auto-registro inicial permite continuar con advertencia suave si la cámara frontal no logra detectar un rostro perfecto.

### C. Chequeo de Subred IP Permisivo y Configurable
* Se implementa la bandera `ip_check_enabled` por sesión en la base de datos.
* Se permite el bypass automático para conexiones locales (`localhost`, `127.0.0.1`, subredes NAT compartidas) y se flexibiliza para no rechazar solicitudes provenientes de operadores móviles.

### D. Estabilización de la Rotación QR en Bloques de 60 Segundos
* Los tokens HMAC-SHA256 se generan en ventanas de **60 segundos** (1 minuto) en lugar de 15s.
* Se mantiene un margen de tolerancia (*leeway*) de 10 minutos para sesiones activas, garantizando que una petición enviada durante la transición de bloque no sea rechazada.

### E. Monolito Modular de Proceso Único
* Se descarta la arquitectura de microservicios o el uso de Docker Compose en desarrollo local. El frontend y el backend se ejecutan sobre el mismo servidor Node.js en el puerto 4000, con base de datos SQLite en archivo local y soporte de PostgreSQL para producción.

---

## 3. Consecuencias y Beneficios

* **Velocidad de Registro:** El tiempo promedio de marcación de asistencia se reduce a un proceso fluido de **máximo 1 minuto por aprendiz**.
* **Cero Exclusión Tecnológica:** Ningún estudiante queda fuera de la lista por fallas de cámara, batería o datos móviles gracias a las contingencias de código manual de 6 caracteres y anulación manual (**Override**) del instructor.
* **Mantenibilidad y Trabajo en Equipo:** Los 3 desarrolladores cuentan con áreas aisladas (`frontend/`, `backend/`, `database/`, `docs/`) para trabajar de forma asíncrona mediante ramas independientes sin riesgo de conflictos de fusión.
