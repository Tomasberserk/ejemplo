# Inventario Funcional y Catálogo de Casos de Uso

Este documento presenta el inventario detallado del sistema de control de asistencia académica (`app-attendance`). La estructura de este inventario está organizada en torno a los casos de uso reales y escenarios operativos que experimentan los estudiantes y docentes en el entorno de aprendizaje, proporcionando una visión funcional y técnica equilibrada de la aplicación.

---

## 1. Estructura y Módulos del Sistema

El sistema está diseñado bajo una arquitectura monolítica web dividida en dos componentes principales:

1. **Frontend SPA (`app/`):**
   - Interfaz web de una sola página (Single Page Application) destinada a la gestión del docente y del coordinador.
   - Desarrollada en **HTML5, CSS3 y JavaScript Vanilla**, con el soporte de **Tailwind CSS** (vía CDN) para el diseño de la interfaz de usuario.
   - Se comunica con el servidor mediante peticiones asíncronas nativas (`fetch`) y actualiza el estado de la clase en tiempo real a través de consultas periódicas (polling).
2. **Backend API (`back/`):**
   - Servidor de servicios REST desarrollado en **Node.js con Express** utilizando sintaxis de módulos nativos (ES Modules).
   - Controla las reglas de negocio, la validez temporal del token QR, el algoritmo de puntualidad, la comprobación de red y la persistencia de datos.
   - Sirve estáticamente la aplicación del docente y genera de forma dinámica la vista móvil de registro de asistencia para los estudiantes en la ruta `/attendance/:token`.

---

## 2. Catálogo de Casos de Uso (Escenarios del Aula)

### Caso 1: Registro de Asistencia Regular (Flujo Estándar)
* **Descripción:** El estudiante se encuentra presente de manera puntual al inicio de la jornada académica.
* **Comportamiento del Sistema:** El docente activa la sala y proyecta el código QR. El estudiante escanea el código desde su dispositivo móvil, ingresa su número de documento de identidad y su contraseña. El sistema registra el ingreso de forma inmediata y asigna las **6 horas completas** de la clase.
* **Componentes:** Lector QR de cámara, formulario de autenticación del alumno y lógica de cálculo horario estándar.

### Caso 2: Registro de Asistencia Tardía con Descuento Horario (Puntualidad Fraccionada)
* **Descripción:** Un estudiante ingresa a la sesión de clase con un retraso significativo (posterior al margen de tolerancia de 15 minutos).
* **Comportamiento del Sistema:** Al identificarse en el portal de asistencia, el sistema calcula el tiempo transcurrido desde el inicio de la sesión y descuenta las horas de forma proporcional (por bloques horarios de 1 hora). El sistema registra un estado de "Asistencia Parcial", asignando, por ejemplo, **5 horas validadas** y **1 hora de inasistencia (falla)**.
* **Componentes:** Algoritmo de cálculo de retardo y alertas de estado en la pantalla de confirmación.

### Caso 3: Registro Manual por Exclusión Tecnológica (Ausencia de Conectividad o Batería)
* **Descripción:** Un estudiante asiste a la clase pero no puede registrarse de forma autónoma debido a la falta de batería en su dispositivo o ausencia de conectividad.
* **Comportamiento del Sistema:** Al finalizar la clase, el docente accede a la grilla interactiva de su panel de control, busca al alumno por su nombre y realiza un registro manual (**Override**), validando sus horas de presencia directamente en la base de datos.
* **Componentes:** Buscador de la grilla de asistencia y controlador de modificación manual de registros.

### Caso 4: Intento de Registro Remoto No Autorizado (Mitigación de Suplantación)
* **Descripción:** Un estudiante ausente intenta registrar su asistencia de forma remota utilizando una fotografía del código QR enviada por un compañero.
* **Comportamiento del Sistema:** 
  - Si el escaneo ocurre fuera del intervalo de 15 segundos, el sistema rechaza la petición debido a la expiración del token QR.
  - Si se intenta registrar dentro del intervalo, el sistema valida la dirección IP del estudiante. Al detectar que no proviene de la subred de la red local del aula (Wi-Fi de aprendices), la petición es rechazada y registrada en la lista de intentos fallidos por suplantación.
* **Componentes:** Rotador de tokens (HMAC-SHA256) en el backend y verificador de subred IP.

### Caso 5: Fallo de Captura en Cámara de Dispositivo (Método de Ingreso Alternativo)
* **Descripción:** El dispositivo móvil del estudiante presenta fallos en la cámara o en el enfoque del código QR proyectado.
* **Comportamiento del Sistema:** El portal de asistencia permite al estudiante seleccionar la opción "Ingresar Código Manual". El alumno digita el código de 6 caracteres alfanuméricos provisto por el docente en la proyección y el sistema registra su asistencia de manera regular.
* **Componentes:** Campo de entrada de texto manual en el portal del estudiante.

### Caso 6: Registro Posterior al Cierre de Sesión (Solicitud de Validación Tardía)
* **Descripción:** Un estudiante llega al aula después de que el docente ha cerrado oficialmente la sala de asistencia de la jornada.
* **Comportamiento del Sistema:** Al ingresar su documento, el sistema notifica que la sesión está cerrada, pero le permite rellenar un formulario de **Petición Tardía (Late Request)** justificando su retraso. El docente recibe esta solicitud en su bandeja de entrada para su posterior evaluación.
* **Componentes:** Formulario de petición tardía y bandeja de resoluciones en el panel docente.

### Caso 7: Justificación de Inasistencias Previas (Carga y Validación de Excusas)
* **Descripción:** Un estudiante que faltó a una sesión anterior desea justificar su inasistencia mediante un soporte oficial (incapacidad médica o justificación laboral).
* **Comportamiento del Sistema:** El estudiante accede a su historial, selecciona la clase correspondiente y sube un documento de soporte (Base64) acompañado de una justificación escrita. El docente revisa el documento en su panel y, de ser aprobado, el sistema recalcula y valida las horas justificadas.
* **Componentes:** Formulario de carga de adjuntos en el panel del estudiante y bandeja de aprobación en el panel docente.

### Caso 8: Registro de Estudiante Nuevo en el Aula (Autoregistro Temporal)
* **Descripción:** Un estudiante asiste por primera vez al grupo pero no se encuentra matriculado en la base de datos de la ficha académica.
* **Comportamiento del Sistema:** Al ingresar su documento en el QR, el sistema le notifica que no figura en la lista y le ofrece la opción de "Autoregistro". El estudiante ingresa su nombre y crea una contraseña, registrando su asistencia de ese día y quedando matriculado en el grupo en tiempo real.
* **Componentes:** Formulario de registro público rápido en caliente en el portal de estudiantes.

### Caso 9: Auditoría Académica de Evidencia de Jornada (Acceso de Coordinador)
* **Descripción:** El coordinador académico de la institución requiere verificar la validez y realización efectiva de la sesión impartida por el docente.
* **Comportamiento del Sistema:** El coordinador accede a su panel administrativo, audita el histórico de jornadas de la ficha y comprueba la existencia de la evidencia fotográfica del salón que el docente está obligado a subir al cerrar la sala.
* **Componentes:** Vistas administrativas del coordinador e histórico de evidencias fotográficas asociadas a sesiones de asistencia.

---

## 3. Modelo Conceptual de Datos

La persistencia del sistema está organizada de forma relacional bajo las siguientes entidades (gestionadas dinámicamente en SQLite/PostgreSQL):

* **`institutions`:** Datos de configuración visual, temas de color y nombres de rol.
* **`academic_units`:** Fichas formativas o materias.
* **`people`:** Registros de usuarios (docentes, alumnos, coordinadores y directivos).
* **`enrollments`:** Relación matricular entre alumnos y fichas formativas.
* **`attendance_sessions`:** Datos de control de la sala activa (fechas, tokens QR activos e IP del docente).
* **`attendance_records`:** Bitácora individual de las asistencias (estado, horas validadas e IP del estudiante).
* **`excuses`:** Almacenamiento de textos y soportes digitales de justificaciones.
* **`late_requests`:** Registro de solicitudes por llegada tardía de alumnos rezagados.

---

## 4. Oportunidades de Mejora Identificadas

* **Inconsistencias en Etiquetas de Interfaz:** El botón principal de exportación de datos en el panel de reportes está etiquetado como "Imprimir", cuando su función real es exportar un archivo Excel (`.xlsx`). Esto induce a errores de interpretación al usuario final.
* **Seguridad de Credenciales Iniciales:** Los datos semilla inicializan a los estudiantes con su número de documento de identidad como contraseña por defecto en texto plano. Se requiere implementar la obligatoriedad de cambio de credenciales en el primer acceso.
* **Fricción por Uso de Datos Móviles:** Aunque el aula cuenta con una red Wi-Fi de aprendices para la conexión IP local, la validación estricta de subred IP excluye y bloquea temporalmente a estudiantes que intentan registrarse utilizando sus datos móviles personales.
