# Priorización MoSCoW y Evaluación Metodológica de Calidad

Este documento presenta la priorización metodológica de la jornada académica a través de la matriz MoSCoW, establece los indicadores de calidad del prototipo actual y expone la autorreflexión crítica del equipo sobre la planificación del desarrollo.

---

## 1. Matriz MoSCoW de Casos de Uso (Prioridades de la Entrega)

Para asegurar la correcta entrega y sustentación del proyecto sin alterar el código de la aplicación que se encuentra actualmente desplegada y operativa, se establece la siguiente priorización de escenarios de uso:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              MATRIZ MoSCoW                             │
│                                                                        │
│  MUST HAVE (Crítico para hoy)           SHOULD HAVE (Importante)       │
│  ┌───────────────────────────────────┐  ┌───────────────────────────┐  │
│  │ - Consistencia operativa de:      │  │ - Evaluación de:          │  │
│  │   * Caso 1: Registro Estándar     │  │   * Caso 2: Cálculo de    │  │
│  │   * Caso 3: Registro Manual       │  │     puntualidad.          │  │
│  │   * Caso 5: Código Manual         │  │   * Caso 4: Control de    │  │
│  │   * Caso 8: Autoregistro          │  │     suplantación e IP.    │  │
│  └───────────────────────────────────┘  └───────────────────────────┘  │
│                                                                        │
│  COULD HAVE (Opcional si hay tiempo)    WON'T HAVE (Futuras sesiones)  │
│  ┌───────────────────────────────────┐  ┌───────────────────────────┐  │
│  │ - Esbozo conceptual en papel:     │  │ - Modificaciones al código  │  │
│  │   * Caso 6: Validación Tardía     │  │   fuente de la aplicación.│  │
│  │   * Caso 7: Historial de excusas  │  │ - Caso 9: Auditoría de    │  │
│  │                                   │  │   coordinador en vivo.    │  │
│  └───────────────────────────────────┘  └───────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 🟩 Must Have (Requerido) - Escenarios Esenciales de Operación
* **Caso 1 (Registro Estándar):** El flujo principal de toma de asistencia debe mantenerse completamente operativo para garantizar el funcionamiento básico del sistema en el aula.
* **Caso 3 (Registro Manual):** El docente debe poder solventar de forma manual exclusiones por conectividad o fallos de batería en los dispositivos de los estudiantes.
* **Caso 5 (Ingreso Manual):** Habilitar el código alternativo de 6 caracteres es obligatorio para no excluir a alumnos con fallos de cámara.
* **Caso 8 (Autoregistro):** Permitir el autoregistro rápido en caliente para incorporar a estudiantes trasladados o no matriculados inicialmente en la base de datos.
* **Documentación Académica:** Consolidar el inventario de casos de uso y la ingeniería inversa en el portafolio de entrega.

### 🟨 Should Have (Debería tener) - Control de Procesos y Calidad
* **Caso 2 (Cálculo de puntualidad):** Validar la consistencia lógica de la asistencia fraccionada por bloques de retraso para asignar el cómputo de horas de forma justa.
* **Caso 4 (Control de suplantación):** Asegurar la rotación del token QR cada 15 segundos en el backend para resguardar la honestidad de la asistencia en el aula.

### 🟦 Could Have (Podría tener) - Extensiones Secundarias
* **Caso 6 (Validación Tardía):** Formulario de registro de justificación por retraso tras el cierre oficial de la sala.
* **Caso 7 (Historial de excusas):** Carga y revisión de soportes documentales de inasistencias en clases anteriores.

### 🟥 Won't Have (No se hará hoy) - Fuera del Alcance
* **Modificación de Código:** Se prohíbe realizar cambios de última hora en el código fuente de la aplicación para evitar regresiones o inestabilidades en la presentación de hoy.
* **Caso 9 (Auditoría del coordinador):** La validación fotográfica de evidencias por la coordinación se pospone, ya que no interfiere en el registro operativo de la asistencia.

---

## 2. Indicadores Cualitativos de Desempeño (KPIs)

Evaluamos cualitativamente el grado de éxito de la solución actual en la resolución de los escenarios reales descritos en el inventario:

| Escenario Evaluado | Nivel de Éxito | Evaluación Cualitativa del Comportamiento |
|---|---|---|
| **Caso 1 (Estudiante Puntual)** | ⭐⭐⭐⭐⭐ | Excelente. El registro de asistencia mediante código QR dinámico se efectúa de manera fluida en menos de 10 segundos. |
| **Caso 3 (Registro Manual)** | ⭐⭐⭐⭐☆ | Bueno. La grilla del docente responde de forma rápida, aunque el botón de override manual podría simplificarse en términos de UX. |
| **Caso 5 (Fallo de Cámara)** | ⭐⭐⭐⭐⭐ | Excelente. El ingreso mediante el código de 6 caracteres es una contingencia de alta fiabilidad y rapidez. |
| **Caso 8 (Alumno Nuevo)** | ⭐⭐⭐⭐☆ | Bueno. El flujo de autoregistro funciona, pero requiere que el docente refresque la grilla para visualizar los nuevos ingresos matriculados en caliente. |
| **Caso 4 (Evitar Trampa)** | ⭐⭐⭐☆☆ | Regular. La rotación de tokens es robusta, pero la validación de subred IP bloquea por error a estudiantes que usan datos móviles en lugar del Wi-Fi de aprendices. |

---

## 3. Reflexión Metodológica: El Impacto de Omitir la Planificación

La principal lección del equipo tras el desarrollo de esta aplicación es que **la codificación directa de una solución sin una etapa previa de diseño conceptual e ideación en papel eleva drásticamente el riesgo de fallos de diseño y usabilidad**.

* **Consecuencia del Apresuramiento:**
  Al no modelar primero en papel los casos de uso, dedicamos demasiado tiempo a programar y probar el control estricto de subredes IP (Caso 4) asumiendo que todos usarían la red Wi-Fi de aprendices del salón. Sin embargo, en el aula real es común que algunos estudiantes se conecten por costumbre con sus datos móviles personales, lo que causa que el sistema los bloquee por no estar en la misma subred local y obliga al docente a realizar registros manuales innecesarios.
* **Lección Aprendida:**
  Si hubiéramos diseñado en papel y analizado cualitativamente el contexto del aula real primero, habríamos identificado que el **Caso 3 (Estudiante sin internet)** y el **Caso 5 (Fallo de cámara)** eran de mayor prioridad y urgencia en la experiencia real que la automatización de la auditoría de evidencias del coordinador.
* **Compromiso Metodológico:**
  A partir de ahora, todo desarrollo del grupo iniciará dibujando las interacciones en papel y validando con MoSCoW qué escenarios de usuario son indispensables antes de tirar la primera línea de código.
