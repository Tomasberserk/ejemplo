# Checklist Funcional

Este checklist se utiliza para verificar el correcto funcionamiento del sistema de asistencia académica en un entorno local o de desarrollo.

## Preparación del Entorno

- [ ] Node.js instalado (v18 o superior).
- [ ] Dependencias del backend y frontend instaladas mediante `npm run install:all`.
- [ ] Archivo `.env` configurado en `back/` (si aplica).
- [ ] Servidor de desarrollo iniciado con `npm run dev` (ejecutándose en `http://localhost:4000`).
- [ ] Endpoint de salud `GET /health` responde con código `200` y cuerpo `'ok'`.
- [ ] Endpoint de estado `GET /ready` responde con código `200` y cuerpo `'ready'` (confirmando conexión con SQLite local).

## Flujo Operativo SENA (Instructor & Aprendiz)

- [ ] Ingresar a la aplicación web del instructor en `http://localhost:4000`.
- [ ] Iniciar sesión con documento `1079606375` e institución `SENA`.
- [ ] Seleccionar el rol de Instructor y verificar que se cargan los colores institucionales (Verde SENA).
- [ ] Cargar el selector y seleccionar una Ficha académica disponible (ej. `3413974`).
- [ ] Crear la sala de asistencia haciendo clic en "Crear Sala" con un TTL de 15 minutos.
- [ ] Proyectar o abrir el QR dinámico (apuntando a `http://localhost:4000/attendance/sala_...`).
- [ ] Escanear el QR desde el móvil o ingresar a la URL e introducir el documento de identidad de un aprendiz matriculado (ej. Tomas Berserk `1077228780`).
- [ ] Verificar que el sistema solicita contraseña y realizar el check-in (devolviendo "Asistencia Confirmada" con 6 horas asistidas).
- [ ] Verificar que en el panel del instructor se actualiza la grilla de presentes automáticamente y muestra al aprendiz ingresado.
- [ ] Reintentar marcar la asistencia con el mismo documento y constatar el rechazo por registro duplicado.
- [ ] Cerrar la sala de asistencia de forma manual desde el panel del instructor.
- [ ] Intentar registrar la asistencia de un aprendiz con la sala cerrada y verificar que la petición es denegada, redirigiendo al formulario de retraso tardío (Late Request).

## Reportes y Excusas

- [ ] En el panel del instructor, navegar a la pestaña **Reports** y verificar la grilla de asistencia.
- [ ] Hacer clic en el botón de exportación y verificar que se descarga un archivo Excel válido con la extensión `.xlsx`.
- [ ] En la pestaña de **Late Requests**, validar que se puede ver y autorizar una solicitud de validación tardía.
- [ ] En la pestaña de **Excuses**, validar que se pueden revisar y aprobar las justificaciones cargadas por los aprendices.
