# MedaPark

Aplicación web para consultar y gestionar parqueaderos en Medellín (MVP, trabajo universitario).

- **Usuario (anónimo)**: ve en un mapa los parqueaderos activos, su disponibilidad y tarifas, y genera la ruta en Google Maps.
- **Administrador de Parqueadero**: inicia sesión con MFA (TOTP) obligatorio y gestiona su parqueadero, sus celdas y su ocupación.

Stack: Vite + React 19 + TypeScript (migración en curso desde JS) + Tailwind 4 + `react-router` 8 + Leaflet.
El back es un proyecto de Supabase (Auth, PostgreSQL, RLS) administrado por el equipo: **todo cambio en el back
es 🔴 CRITICIDAD ALTA y requiere un check de autorización** (`docs/cambios-back/`). Estado actual en
`docs/supabase-esquema-actual.md`.

## Ramas (Gitflow)

| Rama | Uso |
|------|-----|
| `main` | Producción: **Netlify publica cada cambio**. Solo recibe merges revisados desde `develop` |
| `develop` | Integración |
| `feature/NNN-nombre` | Una por feature de Spec Kit (por ejemplo, `feature/001-autenticacion-admin`), creada desde `develop` y fusionada por PR |

## Desarrollo guiado por especificaciones (Spec Kit)

> **Este repo se modifica solo mediante agentes de IA** siguiendo **[`AGENTS.md`](AGENTS.md)** (reglas obligatorias,
> patrones y anti-desalineación). Cada PR actualiza **[`CHANGELOG.md`](CHANGELOG.md)**.

Orden de lectura:

1. `AGENTS.md`: reglas de trabajo para agentes y personas.
2. `.specify/memory/constitution.md`: principios no negociables (incluye el control de cambios del back con CRITICIDAD ALTA).
3. `docs/analisis-mvp.md`: decisiones, inconsistencias resueltas, mensajes exactos e integración con el repo existente.
4. `docs/supabase-esquema-actual.md` y `docs/cambios-back/`: el back real y el control de cambios (🔴 ALTA).
5. `specs/<feature>/`: `spec.md` → `plan.md` (+ `research.md`, `data-model.md`, `contracts/`, `quickstart.md`) → `tasks.md`.

| Feature | Historias de usuario | Rama de implementación |
|---------|----------------------|------------------------|
| `specs/001-autenticacion-admin` | HU1, HU2, HU8 (+ migración a TS) | `feature/001-autenticacion-admin` |
| `specs/002-gestion-parqueadero` | HU3, HU4, HU5, HU6, HU7 | `feature/002-gestion-parqueadero` |
| `specs/003-consulta-publica` | HU9, HU10, HU11 | `feature/003-consulta-publica` |

Para implementar con Claude Code: crear la rama de la feature desde `develop`, apuntar `.specify/feature.json` a
`specs/NNN-nombre` y ejecutar `/speckit-implement`. El orden es estricto: 001 → 002 → 003.

## Desarrollo local

```bash
npm install
npm run dev
```

Requiere un archivo `.env` (no versionado) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Documentación fuente

- `docs/historias-usuario/`: documento de historias de usuario (PDF y texto).
- `docs/prototipos/`: prototipos por HU, base de los mocks en Pencil (`design/`).
- `docs/assets/logos/`: logos de referencia.
