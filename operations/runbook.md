# Runbook de Operaciones — app-attendance

Este runbook detalla las instrucciones operativas para instalar, ejecutar y solucionar problemas en el stack monolítico real de la aplicación (Node.js/Express + SQLite/PostgreSQL).

---

## 1. Puesta en Marcha en Entorno Local

El sistema está empaquetado para correr de manera directa sin requerir contenedores de Docker o bases de datos externas pre-instaladas.

### Paso 1: Instalación de Dependencias
Ejecutar el comando de instalación recursiva desde la raíz del proyecto para descargar las librerías del backend:
```powershell
npm run install:all
```

### Paso 2: Configuración de Variables de Entorno
1. Crear un archivo de variables de entorno (opcional) en la carpeta `back/`.
2. Parámetros soportados:
   - `PORT`: Define el puerto del servidor monolítico (por defecto `4000`).
   - `JWT_SECRET`: Llave secreta para firmar tokens (por defecto `'super-secret-key-for-dev-only'`).
   - `DATABASE_URL`: Cadena de conexión a PostgreSQL (opcional; si se omite, se usa SQLite local).

### Paso 3: Iniciar la Aplicación en Desarrollo
Ejecutar el script de inicio en desarrollo desde la raíz del proyecto:
```powershell
npm run dev
```
Esto iniciará el servidor Express en `http://localhost:4000`, inicializará automáticamente el archivo de base de datos local `back/database.sqlite`, creará las tablas y sembrará los datos iniciales.

---

## 2. Direcciones de Acceso Local

| Componente | URL de Acceso |
|---|---|
| **Panel Docente/Coordinador** | http://localhost:4000 |
| **Página de Asistencia Estudiante** | http://localhost:4000/attendance/manual |
| **Chequeo de Proceso (Health)** | http://localhost:4000/health |
| **Chequeo de Base de Datos (Ready)** | http://localhost:4000/ready |

---

## 3. Ejecución de Pruebas de Integración

Con el servidor Express corriendo en el puerto 4000, abre una nueva terminal y ejecuta la suite de pruebas de integración para validar el correcto funcionamiento de los endpoints:
```powershell
node back/test-integration.js
```

---

## 4. Credenciales de Prueba por Defecto

* **Instructor SENA:** documento `1079606375` (Contraseña: `1079606375`).
* **Coordinador SENA:** documento `9999999999` (Contraseña: `coord.2026`).
* **Aprendiz SENA:** documento `1077228780` (Contraseña: `1077228780`).

---

## 5. Solución de Problemas Comunes

| Síntoma | Causa probable | Acción correctiva |
|---|---|---|
| **Error: `SQLite database locked`** | Múltiples procesos intentan escribir en SQLite simultáneamente. | Cierra procesos Node.js huérfanos que hayan quedado corriendo en segundo plano (`killtask` / `killall`). |
| **Dot de API en rojo en la App** | La SPA no puede conectar con la API. | Verifica que el campo URL superior en la SPA apunte exactamente a `http://localhost:4000` (o a tu URL de ngrok pública). |
| **El QR no se genera** | Error al cargar la librería `qrcodejs` por CDN. | Asegúrate de que la máquina tiene conexión a internet activa para descargar los scripts del CDN en el arranque del cliente. |
| **Fallo en IP Check de Estudiantes** | Los estudiantes entran desde red de datos 4G/5G y el instructor en Wi-Fi. | Edita la sala en el panel del instructor y desmarca la casilla "Validación de IP" antes de crear la sala. |
