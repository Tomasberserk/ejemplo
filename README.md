# 📋 Sistema de Control de Asistencia Académica SENA (`sena-attendance-system`)

> **Monorepo Modular Ligero para Control de Asistencia Presencial con Código QR Rotativo, Biometría Facial IA y Mitigación de Fraude.**

---

## 🚀 Objetivo del Proyecto
Reducir el tiempo de toma de lista tradicional en el aula de clase de **~15 minutos a menos de 10 segundos por aprendiz**, automatizando el cómputo de horas lectivas asistidas (de 6h a 0h por retardo) sin interrumpir la clase y garantizando la presencia física mediante códigos QR dinámicos rotativos (HMAC-SHA256), verificación de red local y reconocimiento facial en el navegador.

---

## 📑 Documentación Canónica

Toda la documentación técnica, arquitectónica y de requerimientos se encuentra organizada en [`docs/`](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs):

- **[📄 Documento de Discovery & Mini-SRS](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs/DISCOVERY.md):** Especificación de requerimientos de software (SRS) inicial estructurada por ingeniería inversa.
- **[🏛️ Arquitectura del Sistema](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs/architecture/architecture.md):** Topología física y lógica de capas.
- **[🔌 Contrato de la API REST](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs/api/api-contract.md):** Endpoints, parámetros y respuestas JSON.
- **[🗄️ Modelo de Datos Relacional](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/database/data-model.md):** Diagramas y diccionario de tablas SQL.
- **[🎓 Ingeniería Inversa & Casos de Uso](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs/academic/INVENTARIO.md):** Catálogo de los 9 escenarios reales de aula.
- **[⚖️ Decisiones de Arquitectura (ADRs)](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs/decisions/):** ADR 001 (Stack), ADR 002 (QR Rotativo), ADR 003 (Reorganización Canónica).
- **[👥 Gobernanza del Repositorio](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs/governance/repository-governance.md):** Git Flow, Conventional Commits y matriz de roles.
- **[📖 Runbook de Operaciones](file:///C:/Users/Aprendiz/.gemini/antigravity/scratch/ejemplo/docs/operations/runbook.md):** Manual de instalación, despliegue y solución de incidentes.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend SPA** | HTML5, CSS3, Vanilla JavaScript, Tailwind CSS (CDN), `html5-qrcode`, `face-api.js` |
| **Backend REST API** | Node.js (Express 5 beta), ES Modules |
| **Persistencia de Datos** | Conmutable: SQLite3 (`database.sqlite`) en local / PostgreSQL en producción |
| **Autenticación & Seguridad** | JWT 24h (`jsonwebtoken`), `bcryptjs`, HMAC-SHA256 para rotación QR |
| **Exportación de Reportes** | SheetJS (`xlsx`) para Excel + `jspdf` / `jspdf-autotable` para PDF |

---

## ⚡ Puesta en Marcha Rápida (Local)

### 1. Clonar e Instalar Dependencias
```powershell
npm run install:all
```

### 2. Iniciar el Servidor en Desarrollo
```powershell
npm run dev
```
El servidor arrancará en `http://localhost:4000`, inicializando automáticamente la base de datos SQLite con los datos semilla.

### 3. Ejecutar Pruebas de Integración
```powershell
npm test
```

---

## 🔑 Credenciales de Acceso por Defecto

| Rol | Documento | Contraseña | Institución | Ficha |
|---|---|---|---|---|
| **Instructor SENA** | `1079606375` | `1079606375` | SENA | 3413974 (ADSO) |
| **Instructor SENA** | `0000000001` | `qwerty.2026` | SENA | 3413974 (ADSO) |
| **Coordinador SENA** | `9999999999` | `coord.2026` | SENA | Global |
| **Aprendiz SENA** | `1077228780` | `1077228780` | SENA | 3413974 (ADSO) |

---

## 🌐 URLs de Acceso

- **Panel del Instructor / Coordinador:** `http://localhost:4000`
- **Portal Móvil de Asistencia Aprendiz:** `http://localhost:4000/attendance/manual`
- **Health Check:** `http://localhost:4000/health`
