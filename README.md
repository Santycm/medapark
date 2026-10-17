# MedaPark

Aplicación web para consultar y gestionar parqueaderos en Medellín (MVP, trabajo universitario).

- **Usuario (anónimo)**: ve en un mapa los parqueaderos activos, su disponibilidad y tarifas, y genera la ruta en Google Maps.
- **Administrador de Parqueadero**: inicia sesión con MFA (TOTP) y gestiona su parqueadero, sus celdas y su ocupación.

Stack: Vite + React + TypeScript + Tailwind · Supabase (Auth, PostgreSQL, RLS) · Leaflet/OpenStreetMap.

## Desarrollo guiado por especificaciones (Spec Kit)

Este repo usa [GitHub Spec Kit](https://github.com/github/spec-kit). El orden de lectura es:

1. `.specify/memory/constitution.md`: principios no negociables.
2. `docs/analisis-mvp.md`: decisiones del análisis, inconsistencias resueltas y mensajes exactos.
3. `specs/<feature>/`: `spec.md` → `plan.md` (+ `research.md`, `data-model.md`, `contracts/`, `quickstart.md`) → `tasks.md`.

| Feature | Historias de usuario |
|---------|----------------------|
| `specs/001-autenticacion-admin` | HU1, HU2, HU8 |
| `specs/002-gestion-parqueadero` | HU3, HU4, HU5, HU6, HU7 |
| `specs/003-consulta-publica` | HU9, HU10, HU11 |

Para implementar con Claude Code: cambia a la rama de la feature y ejecuta `/speckit-implement`.

## Documentación fuente

- `docs/historias-usuario/`: documento de historias de usuario (PDF y texto extraído).
- `docs/prototipos/`: prototipos por HU, que sirven de base para los mocks en Pencil.
