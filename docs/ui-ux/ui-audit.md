# UI Audit — App Attendance (Actualizado)

Este documento registra la auditoría de interfaz de usuario (UI) y experiencia de usuario (UX) ejecutada sobre el frontend monolítico actual (`app/index.html` + `app.js`).

---

## 1. Evaluación General de Diseño

El sistema implementa un estilo visual de **Glassmorphic UI Oscuro** que genera una experiencia premium y moderna:
* **Puntos Fuertes (UX/UI):**
  - Gran contraste en pantallas oscuras gracias al uso de gradientes verdes y azules institucionales.
  - El uso de la tipografía "Outfit" le otorga un estilo moderno y limpio.
  - Los estados semánticos de alerta (éxito en verde, retardo en amarillo y reyecciones en rojo) son altamente legibles.
  - El indicador de salud de la API (`apiStatusDot`) aporta confianza técnica al usuario antes de iniciar la jornada.

---

## 2. Diagnóstico de Pantallas e Interfaces (Mejoras DEV 1 Aplicadas)

### A. Pantalla de Bienvenida y Selección de Rol
* **Estado:** ✅ Excelente estado (⭐⭐⭐⭐⭐).
* **Detalle:** Conmutar entre el lector QR de cámara y el login administrativo es claro, ágil y totalmente responsive.

### B. Lector de QR Móvil e Ingreso Manual
* **Estado:** ✅ Optimizado (⭐⭐⭐⭐⭐).
* **Mejora Aplicada (DEV 1):** Se acotó el contenedor de captura de cámara a un máximo de `250px` de altura tanto en la SPA (`#reader`) como en el portal del aprendiz (`#qr-reader-container`), eliminando el scroll vertical en smartphones compactos.

### C. Panel del Instructor (Dashboard) y Exportaciones
* **Estado:** ✅ Optimizado (⭐⭐⭐⭐⭐).
* **Mejora Aplicada (DEV 1):** Se renombró el botón de exportación a **"Exportar Excel (.xlsx)"** con tooltip descriptivo y se jerarquizó el botón de **"Exportar PDF SENA"**, eliminando la confusión con la etiqueta previa de "Imprimir".

### D. Formularios de Acceso y Seguridad Visual
* **Estado:** ✅ Optimizado (⭐⭐⭐⭐⭐).
* **Mejora Aplicada (DEV 1):** Se incorporaron botones interactivos de alternancia de visibilidad (👁️ Ver/Ocultar contraseña) en el Login del Instructor, en el Login del Aprendiz y en el formulario de Auto-registro en caliente.

---

## 3. Estado de Componentes Clave

| Componente | Estado | Calificación | Comentario |
|---|---|---|---|
| **Contadores de Asistentes** | ✅ Aceptado | ⭐⭐⭐⭐⭐ | Los pills de estadística de presentes y ausentes se actualizan en tiempo real. |
| **Grilla de Asistencia** | ✅ Aceptado | ⭐⭐⭐⭐⭐ | Buscador en tiempo real y selector de anulación manual de alta agilidad. |
| **Contenedor del QR Proyectado** | ✅ Aceptado | ⭐⭐⭐⭐⭐ | Renderiza el QR en tiempo de ejecución con cuenta regresiva estable de 60 segundos. |
| **Visor de Cámara Móvil** | ✅ Aceptado | ⭐⭐⭐⭐⭐ | Dimensiones fijadas a 250px para evitar scroll en pantallas de celular. |
| **Botones de Exportación** | ✅ Aceptado | ⭐⭐⭐⭐⭐ | Botones con semántica y etiquetas inequívocas (Excel XLSX y PDF SENA). |
| **Visibilidad de Contraseñas** | ✅ Aceptado | ⭐⭐⭐⭐⭐ | Toggles accesibles para verificar contraseñas antes de enviar peticiones. |
