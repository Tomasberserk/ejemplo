# ADR 002: QR Temporal Basado en Token Público y Código CSR Rotativo

- Fecha: 2026-07-25
- Estado: Aceptado (Actualizado)

## Contexto

El sistema de asistencia debe mitigar el riesgo de suplantación de identidad (donde un estudiante ausente escanea una foto del QR compartida por redes sociales). El QR no debe exponer datos sensibles de la base de datos y debe requerir presencia física activa del alumno en el salón de clase.

## Decisión

Implementar un mecanismo de doble validación dinámica y temporal en el backend:
1. **Token QR Rotativo:** El QR apunta a `{backend_url}/attendance/{token}`. El token se genera dinámicamente en el servidor cada 15 segundos mediante un hash HMAC (`sha256`) combinando el ID de la sesión y el índice de tiempo actual (bloques de 15s). El backend acepta un margen de tolerancia (leeway) de 5 minutos sobre tokens generados previamente para evitar rechazos por latencia de conexión móvil.
2. **Código Manual de Sala Rotativo (CSR):** Si la lectura de cámara del estudiante falla, se habilita el ingreso de un código manual de 6 caracteres. Este código se deriva del token dinámico activo de la sesión.
3. **Chequeo de Subred/IP (NAT Compartido):** Adicionalmente, el backend puede validar opcionalmente que la IP pública del estudiante se encuentre dentro de la misma subred `/24` o compartiendo el gateway de NAT de la conexión a internet del instructor.

## Consecuencias

* **Mitigación de Capturas de Pantalla:** Un código QR copiado o fotografiado pierde validez rápidamente en el servidor (rotación constante).
* **Independencia de Configuración:** Cambiar la URL de la red o del túnel local (ej. ngrok) no exige recompilar la aplicación estática, ya que el token QR se calcula en tiempo de ejecución.
* **Seguridad Absoluta del Cliente:** El QR es opaco; no expone nombres de alumnos, identificadores internos de base de datos ni datos de la ficha académica.
