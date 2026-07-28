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

## 2. Diagnóstico de Pantallas e Interfaces

### A. Pantalla de Bienvenida y Selección de Rol
* **Estado:** ✅ Excelente estado.
* **Detalle:** Conmutar entre el lector QR de cámara y el login administrativo es claro y responsive.
* **Mejora Sugerida:** El ícono del escáner podría tener una micro-animación de respiración para llamar más a la acción.

### B. Lector de QR Móvil e Ingreso Manual
* **Estado:** ⚠️ Operativo con observaciones.
* **Detalle:** La integración de la cámara mediante `html5-qrcode` funciona bien, pero en pantallas pequeñas del celular el visor de cámara puede requerir scroll.
* **Mejora Sugerida:** Limitar el tamaño del contenedor del lector a un máximo de 250px en CSS móvil.

### C. Panel del Instructor (Dashboard)
* **Estado:** ✅ Funcional y coherente.
* **Detalle:** Las pestañas de Control, Reports, Excuses y Late Requests segmentan bien las tareas diarias del docente.
* **Mejora Sugerida:** Al descargar el Excel, el botón `btnPrintReport` (que en realidad exporta a XLSX) no indica claramente en su texto que descargará un archivo Excel; se sugiere renombrarlo a "Exportar Excel".

### D. Portal del Estudiante (Asistencia QR)
* **Estado:** ✅ Excelente estado.
* **Detalle:** La transición paso a paso (Documento -> Login/Contraseña -> Resultado de Asistencia) es fluida.
* **Mejora Sugerida:** Añadir un botón para que el estudiante pueda ver su contraseña oculta antes de enviar.

---

## 3. Estado de Componentes Clave

| Componente | Estado | Calificación | Comentario |
|---|---|---|---|
| **Contadores de Asistentes** | ✅ Aceptado | ⭐⭐⭐⭐⭐ | Los pills de estadística de presentes y ausentes se actualizan bien. |
| **Grilla de Asistencia** | ✅ Aceptado | ⭐⭐⭐⭐☆ | El buscador filtra en tiempo real en base a los caracteres ingresados. |
| **Contenedor del QR** | ✅ Aceptado | ⭐⭐⭐⭐⭐ | Renderiza el QR en tiempo de ejecución y muestra la cuenta regresiva de 15 segundos claramente. |
| **Bandeja de Excusas** | ✅ Aceptado | ⭐⭐⭐⭐☆ | Muestra las justificaciones en texto y permite ver adjuntos Base64 directamente. |
