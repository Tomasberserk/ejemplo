# Gobernanza del Repositorio — sena-attendance-system

Este documento formaliza los estándares de ingeniería de software, flujo de trabajo colaborativo, convención de ramas y commits, y asignación de responsabilidades para el equipo de desarrollo del **Sistema de Asistencia Académica SENA**.

---

## 1. Convención de Nomenclatura del Repositorio y Monorepo

* **Nombre Estándar del Proyecto:** `sena-attendance-system` (todo en minúsculas y con guiones).
* **Estructura Monorepo por Áreas:**
  - `frontend/`: Single Page Application (SPA) para Instructor, Coordinador y vista dinámica de Aprendiz.
  - `backend/`: API REST en Express, autenticación JWT, lógica de puntualidad y adaptadores de BD.
  - `database/`: Esquemas canónicos SQL (`schema.sql`, `seeds.sql`) y diccionario de datos.
  - `docs/`: Documentación integral del sistema organizada por especialidades.

---

## 2. Estrategia de Ramas (Git Flow Ligero / Feature Branches)

Para garantizar el trabajo asíncrono sin colisiones de código (`merge conflicts`), se establece la siguiente política de ramas:

```
main (Producción y código estable)
 │
 ├── feat/frontend-restructure-and-ux   (Asignada a Dev 1)
 ├── feat/backend-restructure-and-security (Asignada a Dev 2)
 └── feat/governance-database-and-tests (Asignada a Dev 3)
```

### Reglas de Ramas:
1. **`main`:** Rama protegida. Solo recibe cambios mediante Pull Requests aprobados y probados.
2. **`feat/<modulo>-<descripcion>`:** Ramas de trabajo individuales para nuevas funcionalidades o refactorizaciones.
3. **`fix/<modulo>-<descripcion>`:** Ramas para corrección de bugs específicos.
4. **`docs/<modulo>-<descripcion>`:** Ramas para actualización exclusiva de documentación.

---

## 3. Estándar de Mensajes de Commit (Conventional Commits)

Todos los integrantes del equipo deben redactar sus mensajes de commit siguiendo el formato:
`<tipo>(<área o módulo opcional>): <descripción concisa en imperativo>`

### Tipos Permitidos:
* `feat:` Nueva funcionalidad para el usuario final (ej. `feat(frontend): add toggle password visibility`).
* `fix:` Corrección de un error en código existente (ej. `fix(backend): adjust camera scan container height`).
* `docs:` Cambios o adiciones exclusivas en archivos de documentación (ej. `docs(governance): add branch strategy`).
* `refactor:` Reestructuración de código que no altera la funcionalidad externa (ej. `refactor(structure): move to canonical 4-folder layout`).
* `test:` Adición o modificación de pruebas unitarias o de integración (ej. `test(backend): add attendance blocks calculation tests`).
* `chore:` Actualización de dependencias, scripts de build o configuración del repo (ej. `chore: update root package.json`).

---

## 4. Matriz de Roles y Asignación del Equipo (3 Desarrolladores)

| Integrante | Rol Principal | Carpeta de Código | Carpeta de Documentación (`docs/`) | Rama de Trabajo |
|---|---|---|---|---|
| **👤 Dev 1** | Frontend & UX Lead | `frontend/` | `docs/ui-ux/`, sección Biometría en ADR 003 | `feat/frontend-restructure-and-ux` |
| **👤 Dev 2** | Backend & Security Lead | `backend/` | `docs/api/`, `docs/security/`, `docs/operations/`, sección IP/QR en ADR 003 | `feat/backend-restructure-and-security` |
| **👤 Dev 3** | DB, Governance & Testing Lead | `database/`, `backend/tests/` | `docs/governance/`, `docs/decisions/` (ADR Lead), `docs/validation/`, `docs/academic/` | `feat/governance-database-and-tests` |

---

## 5. Protocolo de Pull Request e Integración

Antes de solicitar la fusión de una rama hacia `main`, el desarrollador responsable debe cumplir con el siguiente checklist:

1. **Sincronización:** Ejecutar `git pull origin main` en su rama local para resolver cualquier discrepancia.
2. **Validación Local:** Ejecutar `npm run dev` y confirmar que el servidor inicie en el puerto 4000 sin errores.
3. **Pruebas Automatizadas:** Ejecutar `npm test` y verificar que las pruebas pasen en verde.
4. **Revisión Cruzada:** Al menos un compañero de equipo debe revisar y aprobar el Pull Request antes del merge definitivo.
