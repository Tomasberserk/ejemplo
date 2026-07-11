# UI Audit — App Attendance
_Generado por equipo experto PRODUCT_DESIGN_LEAD + SENIOR_UI_UX_DESIGNER_

---

## Diagnóstico por pantalla

### BackendConfigPage
| Problema | Severidad |
|----------|-----------|
| Pantalla vacía excepto input + status panel | Alta |
| Ningún contexto de onboarding — no explica por qué existe | Alta |
| Status panel plano sin indicador visual de conexión | Media |
| Botón "Validar" sin estado loading / feedback | Media |
| No hay jerarquía visual: todo al mismo nivel | Alta |

**Recomendación:** Rediseñar como pantalla de onboarding con guía de pasos.

---

### LoginPage
| Problema | Severidad |
|----------|-----------|
| Hero funcional pero el ícono (bookOutline) no comunica "asistencia" ni identidad | Baja |
| Card con IonList adentro — mezcla estilos Ionic con card custom | Media |
| Microcopy "Ingresa con tu documento" podría ser más orientativo | Baja |

**Estado:** Mayormente resuelto en sesiones previas. Revisión menor.

---

### InstitutionPage
| Problema | Severidad |
|----------|-----------|
| `institution-tile` sin avatar/icono institucional | Alta |
| Solo borde de color = semáforo de prototipo | Alta |
| `tile-mark` (barra de 5px) no comunica identidad institucional | Alta |
| Sin contraste visual entre instituciones | Media |
| Card mínima: solo código, nombre, metadatos | Media |

**Recomendación:** Tiles con área de color de cabecera, iniciales como avatar, nombre completo prominente.

---

### UnitSelectionPage
| Problema | Severidad |
|----------|-----------|
| Lista IonList básica sin diferenciación visual | Media |
| Tipo de unidad (badge-neutral) — todos idénticos | Baja |
| Sin contador de personas por unidad | Baja |
| Unidad seleccionada solo visible por checkmark pequeño | Media |
| Sin agrupación por tipo si hay muchas unidades | Baja |

**Recomendación:** Filas más ricas con tipo como chip de color, estado seleccionado más prominente.

---

### DashboardPage
| Problema | Severidad |
|----------|-----------|
| Hero sin estado de sesión visible | Media |
| 5 action cards sin agrupación conceptual | Baja |
| Métricas sin contexto semántico fuerte | Baja |
| Unit warning banner funcional pero genérico | Baja |

**Estado:** Mayormente resuelto en sesiones previas. Mejora menor.

---

### SessionPage
| Problema | Severidad |
|----------|-----------|
| QR panel sin marco visual premium | Media |
| Room code card buen punto de partida pero podrían ser más grandes | Media |
| Stepper correcto pero labels muy pequeñas | Baja |
| Sin feedback visual de sesión creada vs. activa | Media |
| Botón Cerrar sesión en la parte inferior puede perderse | Baja |

**Recomendación:** Room code como elemento hero central; QR con fondo blanco y sombra.

---

### CheckinPage
| Problema | Severidad |
|----------|-----------|
| IonList con info de sesión es texto plano | Media |
| Sin instrucción visual clara de "debes estar en el aula" | Alta |
| Código OTP buen diseño pero falta contexto institucional | Media |
| Result banner puede mejorar tamaño y legibilidad | Baja |
| Loading state no tiene feedback visual en el botón | Baja |

---

### ResultsPage
| Problema | Severidad |
|----------|-----------|
| Exportar Excel como `fill="outline"` se pierde visualmente | Baja |
| Segmentos con contadores correctos | ✅ |
| Métricas con semántica de colores correctas | ✅ |
| Progress bar funcional | ✅ |

**Estado:** Pantalla en buen estado. Mejora menor.

---

### HistoryPage
| Problema | Severidad |
|----------|-----------|
| Lista sin agrupación temporal (hoy/semana/anteriores) | Media |
| Todas las filas idénticas — sin diferenciación visual por estado | Media |
| Unidad académica como h2 sin contexto adicional | Baja |
| Sin indicador de cantidad de asistentes por sesión si disponible | Baja |

---

### PeoplePage
| Problema | Severidad |
|----------|-----------|
| Sin contador total en el header | Baja |
| Avatares correctos | ✅ |
| Sin búsqueda (pendiente para futura iteración) | Baja |

---

## Problemas transversales
1. **Header blanco plano** — sin identidad visual de marca
2. **Sin subtitle contextual** en header (institución/unidad activa)
3. **Footer nav** con 6 items en 360px puede sentirse apretado
4. **ion-item** con fondo blanco dentro de surface-1 — mismo tono
5. **Botones de acción principal** a veces pierden jerarquía vs. secundarios
6. **Estados vacíos** consistentes pero sin contexto de acción

---

## Componentes que deben rediseñarse
- `InstitutionPage` tiles (prioridad alta)
- `BackendConfigPage` (prioridad alta)
- `CheckinPage` context (prioridad media)
- `SessionPage` QR panel (prioridad media)
- `HistoryPage` rows (prioridad baja)

## Componentes en buen estado
- `MetricGrid` — sistema de variantes funcional ✅
- `PersonRows` / `RejectionRows` — avatares y chips ✅
- `EmptyState` — consistente ✅
- `SessionPage` stepper — correcto ✅
- `CheckinPage` OTP input — premium ✅

---

## Riesgo por archivo
| Archivo | Cambio | Riesgo |
|---------|--------|--------|
| app.css | Header gradient fix + nuevas clases | Bajo |
| variables.css | Tokens adicionales | Bajo |
| App.tsx | Subtitle en header | Bajo |
| BackendConfigPage.tsx | Restructurar JSX | Bajo (solo UI) |
| InstitutionPage.tsx | Tiles con avatar | Bajo (solo UI) |
| UnitSelectionPage.tsx | Filas ricas | Bajo (solo UI) |
| DashboardPage.tsx | Hero session status | Bajo (solo UI) |
| SessionPage.tsx | QR panel premium | Bajo (solo UI) |
| CheckinPage.tsx | Contexto estudiante | Bajo (solo UI) |
| HistoryPage.tsx | Timeline visual | Bajo (solo UI) |
