# Gobernanza del Repositorio y Flujo de Trabajo Git

- **Proyecto:** Sistema de Control de Asistencia SENA (`sena-attendance-system`)
- **Versión:** 1.0.0
- **Líder de Gobernanza:** Desarrollador 3 (Database, Gobernanza, Testing & Coordinación de Docs)
- **Estado:** Activo / Obligatorio

---

## 1. Estrategia de Ramificación (Branching Model)

El proyecto adopta un modelo simplificado basado en *Trunk-Based Development con Feature Branches*, diseñado para maximizar la velocidad de integración continua y erradicar los conflictos de merge.

```
  main (Trunk / Producción Estable)
   │
   ├── feat/governance-database-and-tests (Dev 3)
   ├── feat/frontend-ux-and-offline (Dev 1)
   ├── feat/backend-security-and-ip (Dev 2)
   ├── fix/qr-token-rotation-boundary
   └── docs/academic-and-adr-updates
```

### Convención de Nombres de Ramas

| Prefijo | Propósito | Ejemplo |
| :--- | :--- | :--- |
| `main` | Rama principal, protegida y siempre desplegable. | `main` |
| `feat/` | Nuevas características o módulos asignados por rol. | `feat/governance-database-and-tests` |
| `fix/` | Corrección de anomalías o parches de bugs. | `fix/ip-subnet-comparison` |
| `docs/` | Cambios exclusivos de documentación o actas ADR. | `docs/update-architecture-spec` |
| `refactor/`| Mejoras internas de código sin cambiar comportamiento. | `refactor/db-connection-pooling` |

---

## 2. Convención de Commits (Conventional Commits)

Todos los commits realizados en el repositorio deben ceñirse estrictamente al estándar [Conventional Commits v1.0.0](https://www.conventionalcommits.org/).

### Estructura del Mensaje

```
<tipo>(<alcance opcional>): <descripción corta en imperativo>

[cuerpo opcional detallando el motivo o justificación]

[pie opcional de referencias o tickets]
```

### Tipos Permitidos

* **`feat:`** Una nueva funcionalidad para el usuario o sistema (ej. `feat(offline): add localStorage queue for attendance checkins`).
* **`fix:`** Corrección de un error en el software (ej. `fix(auth): correct token leeway validation window`).
* **`docs:`** Cambios exclusivamente en la documentación o especificaciones (ej. `docs(governance): add branch strategy and PR checklist`).
* **`refactor:`** Modificación del código que no arregla un bug ni añade una feature (ej. `refactor(database): extract canonical schema.sql`).
* **`test:`** Creación, adición o corrección de pruebas automatizadas (ej. `test(punctuality): add unit tests for hours deduction`).
* **`chore:`** Tareas de mantenimiento, scripts de build o dependencias (ej. `chore(deps): update package.json scripts`).

---

## 3. Matriz de Aislamiento por Carpetas (Folder Isolation)

Para evitar bloqueos y colisiones en ramas concurrentes, cada desarrollador tiene propiedad principal sobre áreas específicas del árbol de trabajo:

| Rol | Desarrollador | Carpetas de Código / Datos | Carpetas de Documentación |
| :--- | :--- | :--- | :--- |
| **Dev 1** | Frontend, UX & Cliente | `app/`, vistas de cliente, assets | `docs/ui-ux/`, prototipos |
| **Dev 2** | Backend, API & Seguridad | `back/src/` (auth, server, controllers), `api/` | `docs/security/`, `docs/api/` |
| **Dev 3** | Database, Gobernanza & Tests | `database/`, `backend/tests/`, `package.json` raíz | `docs/governance/`, `docs/decisions/`, `docs/academic/`, `docs/validation/` |

> [!IMPORTANT]
> **Regla de No Intrusión:** Ningún desarrollador puede editar archivos fuera de sus carpetas asignadas sin comunicación previa y consenso explícito del equipo.

---

## 4. Checklist Obligatorio para Pull Requests (PR)

Antes de fusionar cualquier rama hacia `main`, el autor del PR debe certificar el siguiente checklist:

- [ ] **Sincronización:** Se ejecutó `git pull origin main` en la rama local y no existen conflictos de fusión.
- [ ] **Aislamiento de Cambios:** Los archivos modificados pertenecen exclusivamente al ámbito/carpeta asignada.
- [ ] **Pruebas Automatizadas:** La suite de pruebas (`npm test`) corre al 100% en verde sin fallos.
- [ ] **Formato de Commits:** Todos los mensajes de commit respetan la convención Conventional Commits.
- [ ] **Sin Secretos:** No se incluyen archivos `.env`, claves privadas, ni datos personales sensibles no autorizados.
- [ ] **Documentación:** Se actualizaron los documentos técnicos o actas ADR correspondientes si el cambio altera la arquitectura o el modelo de datos.

---

## 5. Criterios de Aceptación y Revisión de Código (Code Review)

1. **Aprobación de al menos un par:** Todo PR debe ser revisado por al menos un desarrollador del equipo antes del merge.
2. **Estrategia de Integración:** Se prefiere *Squash and Merge* o *Rebase Merge* para mantener un historial lineal y limpio en la rama `main`.
