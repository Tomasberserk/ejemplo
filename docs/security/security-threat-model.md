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

### D. Exposición de Credenciales y Contraseñas por Defecto
* **Riesgo:** Fuga de contraseñas de la base de datos o abuso de usuarios inicializados con su número de documento como contraseña.
* **Mitigación:** 
  - Las contraseñas de producción se hashean con Bcrypt (`bcryptjs` con factor de coste 10).
  - Se implementó la bandera `must_change_password` y el endpoint `POST /api/auth/change-password` para obligar al usuario a crear una contraseña segura y personalizada en su primer inicio de sesión.
  - Al consultar personas en el backend, los hashes de contraseña se excluyen de todas las respuestas JSON públicas y privadas.

### E. Inyección de Código / XSS en Entradas Públicas
* **Riesgo:** Inserción de etiquetas HTML/scripts en nombres de aprendices, justificaciones o descripciones de excusas.
* **Mitigación:** Se implementaron las funciones sanitizadoras `sanitizeText()` y `sanitizeDocument()` en el backend, eliminando caracteres especiales (`<`, `>`), acotando la longitud máxima y validando formatos antes de cualquier inserción en la base de datos.

---

## 3. Pendientes y Recomendaciones de Seguridad para Producción

1. **Robustecer `JWT_SECRET`:** Asegurar que en el archivo `.env` de producción se configure una clave secreta criptográfica de al menos 32 caracteres.
2. **Restringir CORS:** Reemplazar el comodín `*` en `backend/src/server.js` por el dominio específico del frontend en producción.
3. **Implementar Rate Limiting:** Limitar la tasa de peticiones en `/api/auth/login` y `/public/student/login` para mitigar ataques de fuerza bruta.
4. **Almacenamiento Seguro de Evidencias:** Para entornos de alta concurrencia, migrar las imágenes Base64 a un bucket S3 o Cloudinary con URLs firmadas y tiempo de vida limitado.
