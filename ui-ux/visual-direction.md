# Visual Direction — App Attendance

Este documento define las directrices y tokens visuales que componen el diseño estético de la aplicación monolítica actual.

---

## 1. Identidad del Producto

**"Control de Asistencia Académica con Anti-Fraude"** — herramienta institucional para instructores SENA y coordinadores.

* **Estilo Visual:** Glassmorphism Oscuro, Premium, de alta fidelidad, con micro-animaciones y gradientes sutiles.
* **Tipografía:** Familia **Outfit** (cargada desde Google Fonts), pesos 300/400/600/700/800/900.
* **Paleta de Colores Base (SENA):**
  - Verde SENA Primario: `#39A900`
  - Azul SENA Secundario: `#003049`
  - Fondos Oscuros: Gradiente radial desde `#0b1f0d` (arriba) hasta `#05080a` (abajo).

---

## 2. Tokens de Estilo en Tailwind CSS y CSS Custom

### A. Superficies Glassmorphism (Efecto Cristal)
Se implementa una clase CSS personalizada llamada `.glass` para todos los paneles y tarjetas:
```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(57, 169, 0, 0.15);
}
```
Esto crea una apariencia de cristal translúcido con un sutil borde verde brillante.

### B. Elementos Semánticos (Alertas)
* **Éxito (Asistencia Registrada):**
  - Clase: `.alert-success`
  - Estilos: Fondo `rgba(34,197,94,.08)`, borde `rgba(34,197,94,.2)`, texto `#4ade80`.
* **Retardos (Asistencia Parcial):**
  - Clase: `.alert-warning`
  - Estilos: Fondo `rgba(245,158,11,.08)`, borde `rgba(245,158,11,.2)`, texto `#fbbf24`.
* **Rechazos (Duplicados / Expirados / Error):**
  - Clase: `.alert-error`
  - Estilos: Fondo `rgba(239,68,68,.08)`, borde `rgba(239,68,68,.2)`, texto `#f87171`.

---

## 3. Componentes Visuales Clave

1. **Botones Premium (`.btn-green`):**
   Esquinas redondeadas (`rounded-xl`), color de fondo primario verde, texto en negrita y micro-animaciones de hover (`transition-all duration-200 hover:-translate-y-px hover:scale-[1.01]`).
2. **Píldoras de Métrica (`.stat-pill`):**
   Contenedores pequeños con borde verde, un valor de texto de tamaño grande (`text-2xl font-black`) y etiquetas descriptivas pequeñas en mayúsculas (`text-[10px] tracking-wider uppercase`).
3. **Indicador de Estado API (`apiStatusDot`):**
   Un círculo pequeño en la barra de navegación que palpita (`animate-pulse`) en verde (`bg-green-500`) cuando detecta el backend activo, o cambia a rojo sólido (`bg-red-500`) en caso de caída de conexión.
4. **Campos de Entrada (`.input-field`):**
   Fondos oscuros semitransparentes, bordes redondeados y un efecto de enfoque (`focus:border-[#39A900]`) que expande una sombra de resplandor verde de 3px (`box-shadow: 0 0 0 3px rgba(57,169,0,.15)`).
