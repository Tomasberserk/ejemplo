# Runtime Checklist

Este checklist describe los requisitos y estados de ejecución esperados en tiempo de ejecución para el correcto despliegue del sistema monolítico de asistencia.

## Base de Datos (Persistencia)

- [ ] El archivo de base de datos `back/database.sqlite` se crea automáticamente si no existe.
- [ ] La base de datos relacional inicializa correctamente las tablas: `institutions`, `academic_units`, `people`, `enrollments`, `attendance_sessions`, `attendance_records`, `excuses`, `late_requests`.
- [ ] El script de inicialización realiza la limpieza y carga de datos iniciales en la primera ejecución (asegurando el usuario Instructor, el Coordinador, y manteniendo limpio a Tomas Berserk como aprendiz).
- [ ] Si se proporciona la variable `DATABASE_URL`, el backend se conecta exitosamente a la instancia remota de PostgreSQL y crea el esquema en lugar de SQLite.

## Backend (API & Estáticos)

- [ ] El proceso de Node.js corre en el puerto `4000` (o el configurado en la variable `PORT`).
- [ ] El endpoint `GET /health` responde `ok` en menos de 100ms.
- [ ] El endpoint `GET /ready` confirma el estado saludable de la conexión a la base de datos (SQLite o PostgreSQL).
- [ ] Los endpoints bajo `/api/institutions` retornan la estructura JSON esperada con los temas de color y etiquetas parametrizadas.
- [ ] La ruta `/attendance/:token` genera de manera dinámica la página HTML móvil de check-in para el estudiante.
- [ ] La expiración de la sala a los 15 minutos de su creación se maneja correctamente en el servidor.

## App (SPA Frontend)

- [ ] El navegador carga correctamente la SPA estática del instructor en la raíz del servidor (`http://localhost:4000`).
- [ ] El indicador visual de salud de la API (`apiStatusDot`) se muestra verde.
- [ ] El cambio de URL del backend en tiempo de ejecución funciona desde el campo de configuración superior.
- [ ] La selección de institución conmuta adecuadamente el tema de color primario (verde SENA) y el microcopy de los formularios.
- [ ] La grilla de asistencia realiza peticiones periódicas (polling) cada 5 segundos para actualizar el listado de ingresados sin congelar la interfaz.
- [ ] El visor de QR rotativo genera un nuevo token y código alfanumérico en pantalla cada 15 segundos.
