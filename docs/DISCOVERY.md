# 📑 Documento de Discovery y Mini-SRS (Software Requirements Specification)

**Proyecto:** Sistema de Control de Asistencia Académica SENA (`sena-attendance-system`)  
**Metodología:** Ingeniería Inversa & Especificación de Requerimientos de Software  
**Fecha de Elaboración:** 2026-08-22  
**Versión:** 1.0.0  

---

## 1. 🎯 Introducción y Planteamiento del Problema

### 1.1 Contexto y Situación Actual
En los centros de formación académica presencial del **SENA**, las sesiones lectivas tienen una duración estándar de **6 horas cronológicas** (correspondientes a jornadas completas diurnas o nocturnas). 

Tradicionalmente, el control de asistencia se efectúa mediante llamados de lista verbales uno a uno o mediante planillas físicas en papel que circulan entre los aprendices.

### 1.2 El Problema Central a Resolver
1. **Pérdida de Tiempo Lectivo:** El llamado de lista tradicional consume entre **10 y 25 minutos** al inicio de cada jornada, reduciendo el tiempo efectivo de transferencia de conocimiento y desarrollo de talleres prácticos.
2. **Interrupción y Fricción Pedagógica:** Interrumpe la concentración y el ritmo de inicio de la clase tanto para el instructor como para el grupo.
3. **Vulnerabilidad a la Suplantación y Errores:** Las planillas de papel son propensas a firmas de favor entre compañeros, pérdida de documentos físicos y errores de transcripción al sistema central.
4. **Falta de Trazabilidad Horaria:** Los métodos convencionales tratan la asistencia como binaria (*Presente* o *Ausente*), impidiendo calcular de forma justa los retardos y el tiempo real de presencia en el aula.

```
┌────────────────────────────────────────────────────────────────────────┐
│                         EL RETO DE DISEÑO                              │
│                                                                        │
│   SITUACIÓN ANTERIOR               ►    OBJETIVO DEL PROYECTO          │
│   • 15 a 25 min de llamado de lista     • < 10 segundos por aprendiz   │
│   • Planillas de papel / firmas         • 100% digital y sin papel     │
│   • Suplantación sin control            • QR rotativo + Subred + Face  │
│   • Asistencia binaria (Sí / No)        • Cálculo de horas (6h a 0h)   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Objetivo Primordial del Producto
> **"Diseñar e implementar una solución web ligera, accesible desde el navegador móvil de cualquier aprendiz sin instalación de aplicaciones pesadas, que reduzca el tiempo total de toma de lista de ~15 minutos a menos de 10 segundos por aprendiz, garantizando la presencia física en el aula mediante mecanismos anti-fraude y calculando automáticamente la puntualidad fraccionada por bloques horarios."**

---

## 2. 👥 Actores y Perfiles de Usuario

| Rol | Perfil y Responsabilidad |
|---|---|
| **👨‍🏫 Instructor / Formador** | Docente titular de la ficha académica. Responsable de abrir la sala de asistencia, proyectar el código QR dinámico, monitorear la grilla de presentes en tiempo real, resolver contingencias (overrides), evaluar solicitudes tardías y aprobar excusas médicas. |
| **🧑‍🎓 Aprendiz / Estudiante** | Alumno inscrito en la ficha. Responsable de escanear el código QR dinámico desde su teléfono móvil (o ingresar el código alternativo de 6 dígitos), validar su rostro mediante biometría facial, confirmar su asistencia y adjuntar soportes de inasistencia cuando aplique. |
| **👔 Coordinador Académico** | Directivo de la institución. Responsable de supervisar las evidencias fotográficas de las sesiones impartidas, auditar el cumplimiento del cronograma formativo y administrar el catálogo de instructores y fichas. |
| **⚙️ Sistema (Servidor Autónomo)** | Proceso backend que rota las semillas criptográficas cada 60s, valida subredes IP, computa el descuento progresivo de horas lectivas y resguarda la privacidad de datos bajo la Ley 1581. |

---

## 3. 📐 Reglas de Negocio (Business Rules - BR)

A través de la ingeniería inversa aplicada sobre la base de código, se extraen las siguientes reglas de negocio fundamentales:

### 🔹 BR-01: Duración Estándar de la Sesión Lectiva
Cada sesión de asistencia creada en el sistema representa una jornada formativa estándar de **6 horas lectivas** programadas (`horas_programadas_sesion = 6`).

### 🔹 BR-02: Algoritmo de Puntualidad y Asistencia Fraccionada por Bloques
La asistencia no es binaria. El cómputo de horas validadas se calcula según el tiempo transcurrido desde la activación de la sala (`activated_at`):
* **Margen de Tolerancia (0 a 15 min):** El aprendiz recibe **6 horas asistidas** y **0 horas de falla** (Estado: `accepted`, Tipo: `REGULAR`).
* **Retardo de 1 Bloque (16 a 60 min):** El aprendiz recibe **5 horas asistidas** y **1 hora de falla** (Estado: `ASISTENCIA_PARCIAL`, Tipo: `RETARDO_BLOQUE_1`).
* **Retardo de 2 Bloques (61 a 120 min):** El aprendiz recibe **4 horas asistidas** y **2 horas de falla** (Estado: `ASISTENCIA_PARCIAL`, Tipo: `RETARDO_BLOQUE_2`).
* **Inasistencia Total:** Si el alumno no registra asistencia durante la sesión, se le computan **0 horas asistidas** y **6 horas de falla** (Estado: `FALLA_TOTAL`).

### 🔹 BR-03: Mitigación de Fraude Remoto (CSR - Código de Sala Rotativo)
Para evitar que un aprendiz comparta una foto del código QR por mensajería a compañeros ausentes:
1. **Token Dinámico HMAC-SHA256:** El código QR proyectado en la pantalla contiene un token efímero de 12 caracteres que caduca y se recalcula en el servidor cada **60 segundos**.
2. **Validación de Subred IP (Opcional):** El servidor verifica que la IP pública del dispositivo del estudiante comparta la subred `/24` de la red local del docente (Wi-Fi institucional del aula). Si el docente lo requiere, puede desactivar este chequeo (`ip_check_enabled = 0`) para permitir conexiones por datos móviles.

### 🔹 BR-04: Principio de Cero Exclusión Tecnológica (Contingencias de Aula)
Ningún aprendiz honesto puede quedar excluido por fallas de hardware:
* **Falla de Cámara en el Móvil:** Si la cámara del aprendiz no enfoca o no funciona, el sistema provee un campo de **código manual de 6 caracteres** (primeros 6 dígitos del token activo) visibles en la proyección del docente.
* **Falta de Batería o Dispositivo:** El docente puede realizar una **Anulación Manual (*Override*)** desde su panel en tiempo real para marcar al estudiante como presente con 6 horas.

### 🔹 BR-05: Protocolo de Justificación de Inasistencias (Excusas)
* Los aprendices disponen de un plazo máximo de **3 días hábiles** tras una clase con inasistencia para subir su justificación escrita y soporte digital (imagen/PDF codificado en Base64).
* El instructor evalúa la excusa desde su bandeja de entrada. Al aprobarla (`approved`), el registro de inasistencia se transmuta automáticamente a **6 horas asistidas** con el estado `EXCUSA_APROBADA`.

### 🔹 BR-06: Solicitud de Ingreso Tardío (*Late Request*)
Si un aprendiz llega al aula tras el cierre oficial de la sala de 15 minutos, el portal le permite enviar una solicitud formal de registro tardío con justificación. El instructor revisa la solicitud y define cuántas horas descontar (por ejemplo, descontar 1h o 2h).

### 🔹 BR-07: Auto-registro Inmediato en Caliente
Si un aprendiz asiste a clase pero no figura en la base de datos de la ficha (ej. traslados o matrículas extemporáneas), el sistema le permite realizar un **auto-registro rápido** ingresando su documento, nombre y contraseña, quedando matriculado y con asistencia marcada de inmediato sin interrumpir la clase.

### 🔹 BR-08: Cumplimiento de Protección de Datos (Ley 1581 de 2012 / Habeas Data)
* **Enrolamiento Biométrico Facial:** Durante el primer registro, el aprendiz captura su foto de referencia para verificación facial mediante IA en el cliente (`face-api.js`).
* **Consentimiento Explícito:** Obligatoriedad de aceptar la política de tratamiento de datos personales previo al registro.
* **Derecho de Supresión:** El aprendiz puede eliminar voluntariamente su cuenta y datos biométricos en cualquier momento desde la pestaña "Mi Cuenta" mediante reautenticación segura.

### 🔹 BR-09: Evidencia de Jornada para Auditoría de Coordinación
Al clausurar la sesión de asistencia, el docente debe adjuntar una fotografía panorámica del aula como evidencia de ejecución real. El coordinador puede auditar estas evidencias en su panel institucional.

---

## 4. 📋 Especificación de Requerimientos Funcionales (RF)

```
┌────────────────────────────────────────────────────────────────────────┐
│                     MÓDULOS FUNCIONALES DEL SISTEMA                    │
│                                                                        │
│   ┌─────────────────────┐    ┌─────────────────────┐                   │
│   │ MÓDULO 1: ACCESO    │    │ MÓDULO 2: SALAS QR  │                   │
│   │ • RF-01 a RF-03     │    │ • RF-04 a RF-06     │                   │
│   └──────────┬──────────┘    └──────────┬──────────┘                   │
│              │                          │                              │
│              ▼                          ▼                              │
│   ┌─────────────────────┐    ┌─────────────────────┐                   │
│   │ MÓDULO 3: APRENDIZ  │    │ MÓDULO 4: MONITOR   │                   │
│   │ • RF-07 a RF-10     │    │ • RF-11 a RF-14     │                   │
│   └──────────┬──────────┘    └──────────┬──────────┘                   │
│              │                          │                              │
│              ▼                          ▼                              │
│   ┌─────────────────────┐    ┌─────────────────────┐                   │
│   │ MÓDULO 5: EXCUSAS   │    │ MÓDULO 6: AUDITORÍA │                   │
│   │ • RF-15 a RF-16     │    │ • RF-17 a RF-19     │                   │
│   └─────────────────────┘    └─────────────────────┘                   │
└────────────────────────────────────────────────────────────────────────┘
```

### Módulo 1: Autenticación y Control de Acceso
* **RF-01 (Inicio de Sesión):** El sistema debe autenticar usuarios (Docentes, Coordinadores, Aprendices) mediante documento de identidad y contraseña, emitiendo un token JWT con vigencia de 24 horas.
* **RF-02 (Control de Roles Basado en Claims):** El sistema debe restringir las rutas protegidas `/api/*` validando la presencia y los roles (`INSTRUCTOR`, `COORDINADOR`, `APRENDIZ`) dentro del token JWT.
* **RF-03 (Auto-registro de Aprendices):** El sistema debe permitir que un aprendiz no matriculado cree su cuenta en caliente durante una sesión abierta, capturando su selfie de referencia y consentimiento de datos personales.

### Módulo 2: Gestión de Salas y Proyección Dinámica
* **RF-04 (Creación de Sala de Asistencia):** El instructor debe poder abrir una sesión seleccionando la ficha académica y configurando el tiempo de expiración (por defecto 15 minutos) y el check de subred IP.
* **RF-05 (Generación y Rotación de Código QR):** El sistema debe proyectar un código QR en tiempo real cuyo token criptográfico HMAC-SHA256 rote automáticamente cada 60 segundos con un contador visual descendente.
* **RF-06 (Reapertura de Sala para Salida):** El instructor debe poder reabrir una sala cerrada por una ventana de 15 minutos para permitir que los aprendices registren su hora de salida (`hora_salida_real`).

### Módulo 3: Portal Móvil del Aprendiz (Check-in Rápido)
* **RF-07 (Lectura de QR y Entrada Manual):** El aprendiz debe poder escanear el QR con la cámara trasera de su dispositivo o digitar manualmente el código de 6 caracteres.
* **RF-08 (Validación Facial con Inteligencia Artificial):** El portal del aprendiz debe ejecutar en el navegador (`face-api.js`) la comparación entre la cámara frontal y la foto de referencia, aprobando automáticamente si la coincidencia es $\ge 45\%$.
* **RF-09 (Fallback por Iluminación/Falla Biometría):** Si la verificación facial no se completa tras 15 segundos, el sistema debe desbloquear un botón de confirmación manual, marcando el registro como `pending_biometric` para posterior visto bueno del docente.
* **RF-10 (Historial de Asistencias y Cuenta):** El aprendiz debe poder consultar en su panel su total de horas asistidas, número de fallas, historial por clase y el botón de eliminación de cuenta (Habeas Data).

### Módulo 4: Monitor en Tiempo Real y Contingencias del Docente
* **RF-11 (Grilla Interactiva en Tiempo Real):** El panel del instructor debe actualizarse automáticamente mediante polling cada 5 segundos, mostrando la lista de aprendices Presentes (con horas validadas y hora de ingreso), Ausentes y Rechazados.
* **RF-12 (Anulación Manual / Override):** El docente debe poder buscar a cualquier aprendiz ausente y registrar su asistencia manualmente con 6 horas en caso de problemas con su dispositivo móvil.
* **RF-13 (Registro de Ingreso Tardío Manual):** El docente debe poder ingresar a un aprendiz que llegó tarde, calculando automáticamente las horas de retardo según el tiempo transcurrido.
* **RF-14 (Resolución de Excepciones Biométricas):** El docente debe poder visualizar la selfie capturada por los aprendices cuya biometría automática falló y aprobar o rechazar el registro con un solo clic.

### Módulo 5: Gestión de Justificaciones y Excusas
* **RF-15 (Carga de Excusas por el Aprendiz):** El aprendiz debe poder seleccionar una clase con inasistencia (dentro de los 3 días posteriores) y adjuntar su texto explicativo y archivo de soporte (PDF/Imagen).
* **RF-16 (Bandeja de Aprobación de Excusas del Docente):** El docente debe poder ver los soportes adjuntos y resolver la excusa (`approved` o `rejected`), recalculando las horas del estudiante automáticamente.

### Módulo 6: Reportes, Auditoría y Coordinación
* **RF-17 (Exportación de Reportes):** El instructor debe poder descargar el informe consolidado de la sesión en formatos estándar **Excel (`.xlsx`)** y **PDF**.
* **RF-18 (Carga de Evidencia Fotográfica de la Sesión):** El docente debe poder capturar o adjuntar una foto del aula al cerrar la sesión de clase.
* **RF-19 (Panel de Coordinación):** El coordinador debe poder auditar el histórico de sesiones con sus evidencias fotográficas y administrar (crear/editar) instructores y fichas académicas.

---

## 5. ⚡ Especificación de Requerimientos No Funcionales (RNF)

| Identificador | Categoría | Requerimiento No Funcional | Criterio de Aceptación |
|---|---|---|---|
| **RNF-01** | **Rendimiento** | Tiempo de procesamiento de check-in ultrarrápido. | Las peticiones de registro de asistencia deben responder en $< 500\,\text{ms}$ en el servidor. El tiempo de marcación total por aprendiz en el aula debe ser $< 3\,\text{segundos}$. |
| **RNF-02** | **Cero Fricción / Usabilidad** | Acceso web directo sin instalación de aplicaciones nativas. | El sistema debe funcionar en cualquier navegador móvil moderno (Chrome, Safari, Firefox) consumiendo HTML5 y Tailwind CSS vía CDN, sin requerir descargas desde tiendas de apps. |
| **RNF-03** | **Arquitectura y Despliegue** | Monolito modular ligero de proceso único. | Frontend y backend deben servirse desde el mismo proceso Node.js en el puerto 4000, eliminando la necesidad de Docker o empaquetadores complejos para pruebas locales. |
| **RNF-04** | **Persistencia Conmutable** | Portabilidad agnóstica de base de datos. | El sistema debe operar con SQLite en archivo local para desarrollo inmediato y conmutar a PostgreSQL en producción mediante la variable de entorno `DATABASE_URL`. |
| **RNF-05** | **Seguridad y Privacidad** | Criptografía estándar y protección de datos. | Contraseñas hasheadas con Bcrypt (costo 10), tokens JWT firmados, consultas SQL 100% parametrizadas contra inyección SQL y estricto cumplimiento de la Ley 1581 (Habeas Data). |
| **RNF-06** | **Diseño e Identidad Visual** | Interfaz Glassmorphism oscura institucional. | Interfaz moderna con tonos oscuros y verde SENA (`#39A900`), tipografía *Outfit* y alertas semánticas de estado de alta legibilidad. |

---

## 6. 🗄️ Modelo de Datos Conceptual

```
┌─────────────────┐             ┌──────────────────┐
│   institutions  │◄───┐        │  academic_units  │
├─────────────────┤    │        ├──────────────────┤
│ id (PK)         │    └────────┤ institution_id   │
│ code, name      │             │ id (PK), code    │
└────────┬────────┘             └────────┬─────────┘
         │                               │
         │ ┌─────────────────────────────┘
         ▼ ▼
┌─────────────────┐             ┌──────────────────┐
│     people      │             │    enrollments   │
├─────────────────┤             ├──────────────────┤
│ id (PK)         │◄────────────┤ id (PK)          │
│ documento (UQ)  │             │ unit_id (FK)     │
│ password        │             │ person_id (FK)   │
│ photo_reference │             └──────────────────┘
│ terms_accepted  │
└────────┬────────┘
         │
         ├───────────────────────────────┐
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│     excuses      │            │attendance_records│
├──────────────────┤            ├──────────────────┤
│ id (PK)          │            │ id (PK)          │
│ session_id (FK)  │◄───────────┤ session_id (FK)  │
│ person_id (FK)   │            │ person_id (FK)   │
│ text, file_data  │            │ horas_validadas  │
│ status           │            │ photo_evidence   │
└──────────────────┘            │ biometric_score  │
                                └──────────────────┘
```

---

## 7. 🔄 Flujo de Toma de Asistencia Rápida (< 10 Segundos)

```
[ INSTRUCTOR EN EL PROYECTOR ]                     [ APRENDIZ EN EL AULA ]
           │                                                  │
 1. Clic en "Crear Sala"                                      │
    (Inicia cronómetro de 15m y QR rotativo)                  │
           │                                                  │
 2. Proyecta QR dinámico en pantalla ════════════════════════►│ 3. Escanea con cámara móvil
           │                                                  │    (o ingresa código manual)
           │                                                  │
           │                                                  │ 4. Ingresa documento/clave
           │                                                  │    (Valida rostro en ~1s con IA)
           │                                                  │
           │                                                  │ 5. Envía check-in al servidor
           │◄─────────────────────────────────────────────────┤
 6. Polling (cada 5s) actualiza grilla                        │ 6. Recibe confirmación inmediata
    (Aparece "Tomas Berserk - 6h - Puntual")                  │    ("✅ Asistencia Confirmada - 6h")
           │                                                  │
 7. Cierra sala y adjunta foto evidencia                      │
```

---

## 8. ✅ Matriz de Trazabilidad y Criterios de Éxito

| Objetivo Inicial | Requerimiento Asociado | Mecanismo de Validación Implementado | Estado de Cumplimiento |
|---|---|---|---|
| **Reducir tiempo de toma de lista de 15m a < 10s** | RF-05, RF-07, RF-08, RNF-01 | QR dinámico + Check-in en un solo paso con biometría en cliente. | ✅ Superado (< 3s por aprendiz) |
| **Evitar suplantación remota** | BR-03, RF-05 | Token QR con rotación HMAC de 60s + Check opcional de subred Wi-Fi. | ✅ Implementado y probado |
| **Cero exclusión tecnológica en el aula** | BR-04, RF-07, RF-09, RF-12 | Código manual de 6 caracteres + Override del docente + Fallback biometría. | ✅ 100% Cobertura de contingencias |
| **Cálculo justo de horas por retardo** | BR-02, RF-11 | Algoritmo de bloques horarios (6h, 5h, 4h... 0h según hora real). | ✅ Validado en integration tests |
| **Auditoría institucional sin papel** | RF-17, RF-18, RF-19 | Exportación Excel/PDF + Evidencia fotográfica obligatoria + Panel Coordinador. | ✅ 100% Digital |
| **Protección de Datos Personales** | BR-08, RF-03, RF-10 | Aceptación de términos Ley 1581 + Opción de autosupresión de cuenta. | ✅ Cumplimiento legal integral |
