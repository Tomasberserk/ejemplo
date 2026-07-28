# ADR 001: Stack y Fronteras de Responsabilidad

- Fecha: 2026-07-25
- Estado: Aceptado (Actualizado)

## Contexto

El sistema de asistencia académica requiere una arquitectura ligera, de rápido despliegue local y en la nube, y que evite la complejidad de compilación móvil nativa en la fase actual. Se debe garantizar seguridad en la toma de asistencia y acceso directo a base de datos únicamente a través de la API del servidor.

## Decisión

Adoptar un stack monolítico web unificado:
- **Frontend SPA:** HTML5 + Javascript Vanilla + Tailwind CSS (vía CDN) + html5-qrcode para el panel del instructor/coordinador.
- **Backend API:** Node.js (Express) para servir los endpoints REST y renderizar de forma dinámica el portal móvil de estudiantes en `/attendance/:token`.
- **Persistencia:** Base de datos relacional conmutable mediante `db.js` (SQLite3 local en archivo y PostgreSQL remota vía `DATABASE_URL`).

## Alternativas Evaluadas y Descartadas

* **Ionic React + Capacitor:** Descartado en esta etapa para evitar configuraciones complejas de empaquetadores y compiladores móviles nativos (Android/iOS) en los PCs de desarrollo de los estudiantes. Se optó por una SPA estática e inyección de vistas móviles.
* **MongoDB + Docker Compose:** Descartado para agilizar el proceso de instalación. Requerir Docker activo en la máquina del estudiante generaba bloqueos constantes en laboratorios de clase. SQLite elimina la necesidad de pre-instalar motores de base de datos.
* **Backend Embebido en Cliente Móvil:** Descartado por seguridad. El cliente móvil jamás realiza conexiones directas a base de datos. Toda consulta e inserción pasa por la validación de tokens y subredes en la API de Express.

## Consecuencias

* **Despliegue unificado:** El proyecto completo corre bajo un solo proceso Node.js en el puerto 4000, facilitando su publicación en plataformas como Vercel o Render.
* **Abstracción del canal:** El backend concentra toda la lógica de negocio (IP check, firmas de QR en bloques de 15 segundos y cálculo de horas por retardo).
* **Portabilidad:** Se garantiza que cualquier estudiante puede clonar el repositorio, ejecutar `npm run install:all` y `npm run dev` para tener la aplicación activa inmediatamente en cualquier sistema operativo.
