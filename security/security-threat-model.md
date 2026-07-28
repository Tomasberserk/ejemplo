# Modelo de Amenazas y Controles de Seguridad

Este documento detalla el análisis de riesgos, amenazas identificadas y las mitigaciones de seguridad implementadas en el sistema monolítico `app-attendance`.

---

## 1. Activos a Proteger

| Activo | Criticidad | Descripción |
|---|---|---|
| **Datos de Asistencia** | Alta | Registros de quién asistió, cuándo, horas validadas y retrasos. |
| **Credenciales Administrativas** | Alta | Documentos y contraseñas de instructores y coordinadores. |
| **Firma de Tokens JWT (`JWT_SECRET`)** | Alta | Llave que firma las sesiones web de los administradores. |
| **Fórmula de Tokens QR Rotativos** | Media-Alta | Semilla utilizada para calcular tokens dinámicos en tiempo de ejecución. |
| **Datos Personales** | Alta | Nombres y números de documento (Regulaciones de protección de datos). |

---

## 2. Amenazas y Mitigaciones Implementadas

### A. Inyección SQL (A03:2021-Injection)
* **Riesgo:** Un atacante ingresa sentencias SQL en campos como `documento` o `password` para vulnerar o descargar la base de datos.
* **Mitigación:** Se prohíbe la concatenación directa de variables en cadenas SQL. El módulo `back/src/db.js` obliga al uso de consultas parametrizadas utilizando placeholders `?` para SQLite3 y su traducción a `$1, $2` para PostgreSQL, garantizando que el motor de base de datos trate los datos del usuario como literales y no como código ejecutable.

### B. Suplantación de Identidad por QR Compartido
* **Riesgo:** Un aprendiz toma foto del código QR y lo comparte con compañeros que están fuera del aula de clase.
* **Mitigación 1 (Token Rotativo CSR):** El token del QR no es estático ni predecible. El backend calcula firmas HMAC-SHA256 en bloques de tiempo de 15 segundos. Los tokens caducan en el servidor y su reutilización fuera del marco de tiempo se deniega.
* **Mitigación 2 (Checkeo de Subred):** El sistema puede validar opcionalmente que la IP del cliente del estudiante comparta la subred `/24` de la IP del instructor, asegurando que estén conectados a la misma red local Wi-Fi.

### C. Acceso no Autorizado a Endpoints (A01:2021-Broken Access Control)
* **Riesgo:** Estudiantes realizan peticiones HTTP directas para alterar asistencias o crear fichas.
* **Mitigación:** El middleware `authenticate` verifica la cabecera `Authorization: Bearer <JWT>` en todas las rutas bajo `/api/*`. Si el token expira (24 horas) o es alterado, Express deniega el acceso (`401 Unauthorized`). Las rutas del coordinador validan explícitamente el rol del JWT usando `requireRole('COORDINADOR')`.

### D. Exposición de Credenciales
* **Riesgo:** Fuga de contraseñas de la base de datos o en respuestas de red JSON.
* **Mitigación:** Las contraseñas de producción se hashean con Bcrypt (`bcryptjs` con costo 10). Al consultar personas en el backend, las contraseñas se filtran y nunca se devuelven en la serialización JSON del endpoint `/api/auth/login`.

---

## 3. Pendientes de Seguridad Antes de Producción

1. **Migración Completa a Bcrypt:** Hashear el 100% de las contraseñas cargadas por defecto en desarrollo que actualmente están en texto plano.
2. **Robustecer `JWT_SECRET`:** Asegurar que en el archivo `.env` de producción se configure una clave secreta larga de al menos 32 caracteres.
3. **Restringir CORS:** Cambiar la configuración de CORS comodín `*` en `server.js` por el dominio específico del frontend en producción.
4. **Implementar Rate Limiting:** Limitar la cantidad de peticiones concurrentes en `/api/auth/login` para mitigar ataques de fuerza bruta.
