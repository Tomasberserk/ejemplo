# Guía de Patrones de Código — app-attendance

Este documento describe las convenciones y patrones de código vigentes en el proyecto para asegurar consistencia y mantenibilidad en la base de código actual.

---

## 1. Patrones del Backend (`back/`)

El backend está estructurado con Javascript ES Modules, exponiendo controladores directos que interactúan con un adaptador de base de datos relacional.

### A. Controladores y Rutas
- Todos los controladores se definen como funciones asíncronas en `back/src/controllers.js` y se exportan de manera nombrada.
- Las rutas se registran en `back/src/server.js` asociando los controladores y aplicando los middlewares necesarios de manera directa.
- Se implementan bloques `try-catch` explícitos en los controladores para el manejo de excepciones y errores inesperados, retornando respuestas estructuradas:
  - Éxito: `{ data: ... }`
  - Error: `{ error: { code: 'CODIGO_ERROR', message: 'Mensaje descriptivo' } }`

```javascript
// Ejemplo de controlador
export const getSomething = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM table');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};
```

### B. Acceso a Base de Datos
- No se inyectan ORMs. Se utiliza la API simplificada definida en `back/src/db.js` que exporta tres helpers principales asíncronos:
  - `query(sql, params)`: Ejecuta una consulta SQL de tipo `SELECT` y retorna un array de filas.
  - `get(sql, params)`: Ejecuta una consulta y retorna únicamente la primera fila encontrada o `null`.
  - `run(sql, params)`: Ejecuta comandos de escritura (`INSERT`, `UPDATE`, `DELETE`) y retorna `{ id, changes }`.
- Para asegurar la portabilidad entre SQLite (que usa placeholders `?`) y PostgreSQL (que usa `$1, $2`), las consultas SQL en los controladores deben escribirse con placeholders `?`. El adaptador `db.js` se encarga de convertirlos dinámicamente si se está utilizando Postgres.

### C. Autenticación y Seguridad
- Rutas públicas y protegidas separadas en `server.js`.
- Las rutas bajo `/api/*` requieren pasar por el middleware `authenticate`, el cual descodifica el JWT e inyecta la información del usuario en `req.user`.
- Las operaciones reservadas a la coordinación utilizan además el middleware `requireRole('COORDINADOR')`.

---

## 2. Patrones del Frontend (`app/`)

El frontend está estructurado como una aplicación monolítica ligera de una sola página (SPA) controlada directamente por manipulación del DOM.

### A. Control de Navegación y Pantallas
- No existe un enrutador en el frontend. La navegación se realiza mediante la inyección y remoción condicional de la clase CSS `hidden` en los contenedores `<section>` de cada pantalla.
- La función centralizada `showDashboard()` evalúa el rol del usuario autenticado en `state.person.roles` y enruta visualmente a `coordDashboardScreen`, `dashboardScreen` (instructor) o `studentDashboardScreen`.

### B. Gestión de Estado Global
- Todo el estado dinámico del cliente se consolida en un único objeto global mutable llamado `state` definido al inicio de `app.js`:
  ```javascript
  let state = {
    apiUrl: window.location.origin,
    token: localStorage.getItem('token') || '',
    person: JSON.parse(localStorage.getItem('person') || 'null'),
    activeSession: null,
    // ...
  };
  ```
- El token y la información del usuario se sincronizan con el almacenamiento persistente mediante `localStorage`.

### C. Consumo de API y Renderizado
- Se realizan peticiones directas al servidor utilizando la API nativa `fetch()`.
- En caso de recibir un estado de respuesta `401 Unauthorized`, se gatilla de inmediato la función `handleAuthError(res)` que limpia las credenciales en `localStorage`, detiene el polling de actualización y redirige al portal de login.
- El renderizado de listas y tablas se realiza concatenando plantillas literales de HTML e inyectándolas en el DOM mediante el atributo `innerHTML` de los contenedores destino.
