# 🔍 Documento de Product Discovery (Descubrimiento y Validación del Problema)

**Iniciativa:** Automatización y Agilización del Control de Asistencia en el Aula  
**Fase de Ciclo de Vida:** Fase 0 — Exploración, Empatía y Validación del Problema  
**Equipo:** Equipo de Desarrollo e Innovación Pedagógica SENA  
**Fecha:** 2026-08-22  
**Estado:** Validado y Aprobado para Construcción  

---

## 1. 📌 Resumen Ejecutivo del Discovery

Este documento recoge los hallazgos de la fase de **Product Discovery** realizada en los ambientes de formación del **SENA**. Su objetivo es explorar a profundidad la problemática cotidiana del llamado de lista presencial, entender las fricciones reales de instructores y aprendices, cuantificar el impacto pedagógico y determinar si vale la pena construir una solución digital y bajo qué principios rectores debe concebirse.

> **Pregunta Central del Discovery:**  
> *"¿Cómo podemos devolverle a los instructores y aprendices los 15 a 25 minutos de clase que se pierden diariamente en el llamado de lista tradicional, garantizando la honestidad del registro presencial sin excluir a nadie por limitaciones tecnológicas?"*

---

## 2. 🚨 Diagnóstico de la Problemática (Estado Actual "AS-IS")

### 2.1 El Contexto del Aula
* **Jornadas:** Clases de formación técnica y tecnológica con una duración estándar de **6 horas cronológicas**.
* **Población:** Grupos de **30 a 40 aprendices** por ambiente de aprendizaje (Ficha).
* **Entorno Tecnológico:** Dispositivos móviles heterogéneos (desde gamas de entrada con cámaras de baja resolución hasta gamas altas), planes de datos móviles limitados y redes Wi-Fi institucionales con concurrencia variable.

### 2.2 ¿Qué pasa hoy? (Síntomas y Dolores Observados)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ANATOMÍA DEL DOLOR EN EL AULA                        │
│                                                                        │
│   1. PÉRDIDA DE TIEMPO          2. SUPLANTACIÓN Y FRAUDE               │
│   • 15 a 25 min por sesión      • Firmas de favor en papel             │
│   • ~6 horas lectivas al mes    • "Cúbreme que llego tarde"            │
│   • Ruptura del ritmo de clase  • Cero trazabilidad horaria            │
│                                                                        │
│   3. ASISTENCIA BINARIA         4. CARGA BUROCRÁTICA                   │
│   • Todo o nada (Presente/Falla)• Transcripción manual a Excel/Sofia   │
│   • Castigo injusto al retardo  • Pérdida y deterioro de planillas     │
│   • Desincentivo al aprendiz    • Fricción en entrega a coordinación   │
└────────────────────────────────────────────────────────────────────────┘
```

#### A. Pérdida Masiva de Tiempo Pedagógico (El Costo Invisible)
* El llamado de lista verbal ("uno por uno") o la circulación de una planilla de papel toma entre **15 y 25 minutos** al iniciar la jornada.
* **Cálculo de Impacto:**  
  $$20\text{ minutos/día} \times 5\text{ días/semana} \times 4\text{ semanas} = 400\text{ minutos/mes} \approx \mathbf{6.6\text{ horas al mes}}$$
* **Conclusión:** Cada grupo pierde el equivalente a **un día completo de clase al mes** únicamente pasando lista.

#### B. Vulnerabilidad a la Suplantación y "Firmas de Favor"
* En las planillas físicas, es habitual que un aprendiz firme por otro compañero ausente.
* El instructor, enfocado en preparar su material y proyector, no puede auditar visualmente cada firma individual.

#### C. Injusticia del Modelo Binario ante la Movilidad Urbana
* La mayoría de aprendices se desplazan en transporte público con trayectos de 1 a 2 horas, expuestos a trancones y lluvias.
* El modelo tradicional es **binario** (*Presente* o *Falla de 6h*). Si un aprendiz llega al minuto 25, muchas veces se le marca falla completa, desmotivándolo a ingresar al aula el resto de la jornada ("ya para qué entro si ya tengo la falla").

#### D. Desgaste Operativo y Burocrático
* El instructor debe transcribir manualmente los datos de las hojas de papel a hojas de cálculo o plataformas institucionales, generando retrasos en la detección temprana de deserción.

---

## 3. 👥 Arquetipos de Usuario y Mapas de Empatía (User Personas)

### 🧑‍🏫 Persona 1: Carlos Mendoza — El Instructor Sobrecargado
* **Rol:** Instructor Técnico de Software (ADSO).
* **Meta:** Iniciar la explicación práctica de programación apenas comience la jornada sin distracciones administrativas.
* **Frustraciones:**
  - *"Pierdo 20 minutos valiosos todos los días llamando a 35 personas por nombre."*
  - *"La planilla de papel se me refunde o se mancha de café en el taller."*
  - *"Al final de la semana tengo que gastar 2 horas pasando datos de papel a Excel."*
* **¿Qué necesita?:** Un mecanismo de "un solo clic" donde los aprendices se registren solos y él solo tenga que monitorear una pantalla.

### 🧑‍🎓 Persona 2: Valentina Ríos — La Aprendiz Comprometida pero con Dificultades de Transporte
* **Rol:** Aprendiz SENA de Ficha 3413974.
* **Meta:** Cumplir con sus 6 horas de clase y mantener su cupo activo.
* **Frustraciones:**
  - *"El bus se varó y llegué 20 minutos tarde; el profe no me dejó firmar y me puso 6 horas de falla injustamente."*
  - *"Mi celular es viejito, no tiene espacio para instalar aplicaciones pesadas ni memoria para apps lentas."*
* **¿Qué necesita?:** Poder marcar su llegada en segundos desde cualquier navegador web sin instalar nada, y que se le reconozcan las 5 horas que sí va a estudiar.

### 👔 Persona 3: Roberto Morales — El Coordinador Académico
* **Rol:** Coordinador de Centro de Formación.
* **Meta:** Garantizar que los ambientes de formación estén operando y auditar la veracidad de las horas reportadas.
* **Frustraciones:**
  - *"No sé si el instructor realmente dictó la clase presencial o si los reportes son inventados a final de mes."*
  - *"Cuando un aprendiz apela una sanción, no hay evidencia sólida de si asistió o no."*
* **¿What necesita?:** Reportes consolidados con evidencia fotográfica real de cada jornada y trazabilidad horaria digital.

---

## 4. 🗺️ Customer Journey Map: El Viaje de la Asistencia

```
FASE           1. INICIO DE JORNADA         2. PASO DE ASISTENCIA          3. CIERRE DE CLASE
─────────────────────────────────────────────────────────────────────────────────────────
VIAJE          Docente llega al aula,       Docente detiene la clase,      Docente guarda la hoja
ACTUAL         enciende proyector, busca    empieza a llamar a viva voz.   de papel; al final de
(AS-IS)        la planilla física.          Aprendices se distraen.        semana digita en Excel.
                     ⚠️                            🔴                              ⚠️
               (Pérdida de foco)           (Pérdida de 20 min)             (Doble digitación)
─────────────────────────────────────────────────────────────────────────────────────────
VIAJE          Docente abre pantalla,       Aprendices apuntan su cámara   Docente cierra sala,
PROPUESTO      hace 1 clic en "Crear Sala". al QR, validan rostro en 2s    toma foto de evidencia.
(TO-BE)        QR visible en el telón.      y quedan presentes.            Reporte Excel en 1 clic.
                     🟢                            ⭐                              🟢
               (0 fricción: 5 seg)         (Fluido: < 10 seg/alumno)       (Trazabilidad 100%)
```

---

## 5. 💡 Preguntas de Oportunidad (How Might We - HMW)

A partir de los dolores identificados, el equipo formuló las siguientes preguntas guía de diseño:

1. **HMW (Velocidad):**  
   *¿Cómo podríamos lograr que 35 aprendices registren su asistencia en menos de 2 minutos totales al inicio de la clase sin que el docente deba nombrarlos uno a uno?*
2. **HMW (Honestidad sin Complejidad):**  
   *¿Cómo podríamos asegurar que quien registra la asistencia esté físicamente sentado en el aula, evitando que compartan capturas de pantalla a compañeros ausentes?*
3. **HMW (Justicia y Retardos):**  
   *¿Cómo podríamos calcular automáticamente las horas reales asistidas (de 6h a 0h) según la hora exacta de ingreso para no castigar con falla total a quien tuvo un percance de transporte?*
4. **HMW (Inclusión y Cero Rechazo Tecnológico):**  
   *¿Cómo podríamos garantizar que un aprendiz con cámara dañada, sin plan de datos o sin batería no quede excluido ni pierda su asistencia?*
5. **HMW (Privacidad y Confianza):**  
   *¿Cómo podríamos usar biometría facial ligera en el navegador del usuario sin almacenar fotos invasivas ni violar la Ley 1581 de Habeas Data?*

---

## 6. 💎 Propuesta de Valor y Principios Rectores del Producto

### La Promesa de Valor:
> **"Un sistema web ultra-ligero que convierte la toma de lista en un acto de 3 segundos mediante códigos QR rotativos y biometría en el cliente, devolviendo 6 horas lectivas al mes al proceso formativo y garantizando cero exclusión tecnológica."**

### Los 5 Principios Rectores Innegociables:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LOS 5 PILARES DE LA SOLUCIÓN                         │
│                                                                        │
│   1. VELOCIDAD EXTREMA          2. CERO INSTALACIÓN                    │
│   • Check-in en < 3 segundos    • Web pura (Vanilla JS + HTML5)        │
│   • 0 interrupciones al docente • Funciona en cualquier celular        │
│                                                                        │
│   3. HONESTIDAD PRAGMÁTICA      4. INCLUSIÓN TOTAL (PLAN B)            │
│   • QR rotativo efímero (60s)   • Código manual de 6 dígitos           │
│   • Subred Wi-Fi del aula       • Anulación manual (Override)          │
│                                                                        │
│   5. PUNTUALIDAD PROPORCIONAL                                          │
│   • 15 min de gracia → 6h completas                                    │
│   • Descuento por bloques de 1 hora según retardo real                 │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Velocidad Extrema ($< 3$ segundos de interacción):** El aprendiz abre la cámara, enfoca el proyector, el sistema reconoce su rostro y confirma. Fin.
2. **Cero Barreras de Entrada (Web Pura):** Ninguna aplicación que requiera descargar 50MB de la Play Store/App Store. Acceso inmediato vía URL/QR desde cualquier navegador móvil.
3. **Anti-Fraude Pragmático:** Código QR con token que cambia dinámicamente cada 60 segundos (HMAC-SHA256), impidiendo que una foto por WhatsApp sirva para registrarse desde la casa.
4. **Resiliencia y Cero Exclusión (Plan B y C siempre activos):**
   - *¿Cámara dañada?* $\rightarrow$ Digita el código de 6 caracteres que aparece bajo el QR.
   - *¿Sin celular o sin batería?* $\rightarrow$ El instructor hace clic en "Ingreso Manual" en su panel.
   - *¿Llegó después de que cerró la sala?* $\rightarrow$ Envía una "Petición Tardía" para que el docente la apruebe.
5. **Justicia Horaria (Asistencia Fraccionada):** Descuento progresivo de horas lectivas (6h, 5h, 4h...) para premiar la puntualidad sin destruir la motivación del que llegó tarde.

---

## 7. ⚖️ Matriz de Riesgos del Producto (Product Risk Assessment)

Siguiendo las mejores prácticas de Product Management (Marty Cagan), evaluamos los 4 grandes riesgos antes de comprometer esfuerzo de desarrollo:

| Tipo de Riesgo | ¿Qué nos preocupaba? | Mitigación Validada en el Discovery | Nivel de Riesgo |
|---|---|---|---|
| **Riesgo de Valor** (*Value Risk*) | Que los instructores encontraran el sistema más engorroso que el papel y lo abandonaran. | La creación de sala toma 1 solo clic y el informe se descarga en Excel listo para entregar. Valor evidente e inmediato. | 🟢 Bajo |
| **Riesgo de Usabilidad** (*Usability Risk*) | Que los aprendices con celulares viejos no pudieran cargar librerías pesadas de inteligencia artificial. | Biometría facial ejecutada localmente en el cliente con umbral permisivo (45%) y botón de escape manual tras 15s si la luz del aula es mala. | 🟡 Controlado |
| **Riesgo de Factibilidad** (*Feasibility Risk*) | Que el servidor colapsara con 40 peticiones concurrentes en el mismo segundo al proyectar el QR. | Arquitectura Express ultraligera de proceso único con endpoints JSON optimizados sin dependencias pesadas ni microservicios innecesarios. | 🟢 Bajo |
| **Riesgo de Viabilidad Legal** (*Viability / Legal Risk*) | Violación de normativas de datos sensibles por captura de fotografías (Ley 1581 de 2012). | Consentimiento explícito obligatorio en el registro, almacenamiento exclusivo para auditoría académica y opción de autosupresión de cuenta en cualquier momento. | 🟢 Controlado |

---

## 8. 📊 Métricas de Impacto y Criterios de Éxito (Success Metrics)

Para validar cuantitativamente que la solución resuelve el problema, se definen los siguientes indicadores clave:

| Métrica | Situación Base (AS-IS) | Meta del Producto (TO-BE) | Impacto Esperado |
|---|---|---|---|
| **Tiempo de Toma de Asistencia por Grupo** | 15 - 25 minutos | **$< 2$ minutos totales** ($< 3\text{s}$ por aprendiz) | **Reducción del 90%** en tiempo administrativo. |
| **Horas Lectivas Recuperadas al Mes** | 0 horas (perdidas) | **~6 a 7 horas mensuales por ficha** | Equivalente a 1 jornada de formación extra al mes. |
| **Tasa de Exclusión Tecnológica** | Alta (en apps nativas) | **0% de aprendices excluidos** | 100% de cobertura gracias a código manual y override. |
| **Uso de Papel Físico** | 100% planillas físicas | **0% papel (100% digital)** | Cero consumo de papelería y cero pérdida de planillas. |
| **Tiempo de Consolidación de Reportes** | 2 a 3 horas semanales | **Inmediato (1 clic en `.xlsx` / `.pdf`)** | Cero tiempo de transcripción manual para el instructor. |

---

## 9. 🏁 Conclusión y Veredicto del Discovery

### ¿Vale la pena resolver este problema?
**SÍ, ROTUNDAMENTE.**

1. **Problema Real y Frecuente:** Afecta a cientos de fichas y miles de horas de formación cada semana en todo el país.
2. **Costo de Inacción:** Seguir usando papel representa una fuga constante de horas lectivas de calidad, facilita la suplantación y satura de burocracia al cuerpo docente.
3. **Factibilidad Demostrada:** Es técnicamente viable construir una solución ligera, portátil y económica en infraestructura que resuelva el problema sin sobreingeniería.

### Siguiente Paso Recomendado:
Proceder con la formalización de la **Especificación de Requerimientos de Software (SRS)** y el desarrollo del prototipo funcional bajo la arquitectura monolítica modular definida en el [ADR 001](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs/decisions/adr-001-stack-and-boundaries.md).
