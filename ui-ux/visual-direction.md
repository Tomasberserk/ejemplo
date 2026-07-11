# Visual Direction — App Attendance
_Product Design Lead + Design System Engineer_

---

## Identidad del producto

**"Control de Asistencia Académica"** — herramienta institucional de confianza para docentes e instructores SENA/universitarios.

**Personalidad visual:** Académica · Moderna · Institucional · Confiable · Limpia · Mobile-first

---

## Paleta de colores

### Brand (azul institucional)
| Token | Valor | Uso |
|-------|-------|-----|
| `--ion-color-primary` | `#1971c2` | Acciones primarias, header brand |
| `--ion-color-primary-shade` | `#1864ab` | Header gradient start |
| `--ion-color-primary-tint` | `#339af0` | Highlight, hover |

### Superficies (no blanco puro)
| Token | Valor | Uso |
|-------|-------|-----|
| `--surface-0` | `#dde5f0` | Fondo de la app |
| `--surface-1` | `#f5f8ff` | Cards, items, formularios |
| `--surface-2` | `#e8eef8` | Superficies secundarias, segmentos |
| `--surface-border` | `#c8d5e8` | Bordes sutiles |

### Acento multi-color (action cards)
| Token | Color | Uso |
|-------|-------|-----|
| `--accent-blue` | `#1971c2` | Unidades académicas |
| `--accent-green` | `#2f9e44` | Personas/alumnos |
| `--accent-violet` | `#7048e8` | Sesión QR |
| `--accent-teal` | `#0c8599` | Resultados |
| `--accent-orange` | `#e67700` | Historial |

### Semánticos
| Estado | Fondo | Borde | Texto |
|--------|-------|-------|-------|
| Success | `#d3f9d8` | `#69db7c` | `#2b8a3e` |
| Danger | `#ffe3e3` | `#ff8787` | `#c92a2a` |
| Warning | `#fff3bf` | `#ffd43b` | `#e67700` |
| Neutral | `#e9ecef` | `#ced4da` | `#495057` |

---

## Tipografía

**Familia:** Inter (Google Fonts) — sistema de pesos 400/500/600/700/800

| Token | Valor | Uso |
|-------|-------|-----|
| `--font-size-xs` | 11px | Eyebrows, labels de badge |
| `--font-size-sm` | 12px | Metadatos, notas |
| `--font-size-base` | 14px | Cuerpo de texto |
| `--font-size-md` | 15px | Labels de acción |
| `--font-size-lg` | 17px | Títulos de sección |
| `--font-size-xl` | 20px | Códigos, hero secundario |
| `--font-size-2xl` | 24px | Títulos de página |
| `--font-size-3xl` | 28px | Pantallas de confirmación |

---

## Espaciado base

| Token | Valor | Uso |
|-------|-------|-----|
| `--space-xs` | 4px | Gap mínimo |
| `--space-sm` | 8px | Gap entre elementos |
| `--space-md` | 16px | Padding de cards |
| `--space-lg` | 24px | Separación entre secciones |
| `--space-xl` | 32px | Hero padding |

---

## Radios
| Token | Valor |
|-------|-------|
| `--radius-sm` | 6px |
| `--radius-md` | 10px |
| `--radius-lg` | 14px |
| `--radius-xl` | 20px |
| `--radius-full` | 9999px |

---

## Sombras

Todas las sombras usan `rgba(15, 30, 60, ...)` — azul-negro que armoniza con la paleta blue-slate.

| Token | Valor |
|-------|-------|
| `--shadow-sm` | Sutil, para cards planas |
| `--shadow-md` | Cards con hover |
| `--shadow-lg` | Modales, cards destacadas |
| `--shadow-colored` | Cards branded (azul) |

---

## Reglas de uso de color

1. **Nunca blanco puro (`#fff`) como superficie principal** — usar `#f5f8ff`
2. **Fondo siempre con profundidad suave** — gradiente azul-slate
3. **Header con identidad** — gradiente branded, no blanco
4. **Un solo color de acción por card** — no mezclar acentos
5. **Estados semánticos solo para contexto real** — no decorativo
6. **Gradientes solo en heroes y header** — no en cards secundarias
7. **Máximo 4 colores en pantalla** — brand + 2 semánticos + surface

---

## Reglas anti-saturación

- No mezclar más de 2 acentos en el mismo viewport
- No usar gradientes en cards de lista
- No usar bordes de color en elementos secundarios
- Action cards: solo icono tiene el color accent, el borde permanece sutil

---

## Diferenciación docente / estudiante

| Rol | Experiencia |
|-----|-------------|
| Docente/Instructor | Dashboard completo, footer con 6 tabs, acceso a sesión QR y reportes |
| Estudiante/Aprendiz | Solo CheckinPage, footer con 1 tab (Asistencia), sin acceso a gestión |
| Visual | Misma paleta, diferente densidad y complejidad de UI |

---

## Componentes clave

| Componente | Características |
|------------|----------------|
| Header | Gradiente branded, título bold, subtitle contextual |
| Hero panel | Deep blue gradient, texto blanco, código institucional |
| Action card | Icono con accent único, shadow suave, hover lift |
| Institution tile | Cabecera de color, avatar de iniciales, metadata |
| Status badge | Pill semántico, peso 700, uppercase |
| OTP input | Boxes individuales, shake on error, filled state |
| Empty state | Icono en wrapper redondeado, action opcional |
| Metric card | Borde izquierdo semántico, fondo tintado |
