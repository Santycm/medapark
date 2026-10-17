# MedaPark

Aplicación web para consultar y gestionar parqueaderos en Medellín (MVP, trabajo universitario).

- **Usuario (anónimo)**: ve en un mapa los parqueaderos activos, su disponibilidad y tarifas, y genera la ruta en Google Maps.
- **Administrador de Parqueadero**: inicia sesión con MFA (TOTP) obligatorio y gestiona su parqueadero, sus celdas y su ocupación.

**Este repo es solo el front.** Stack: Vite + React 19 + TypeScript (migración en curso desde JS) + Tailwind 4 +
`react-router` 8 + Leaflet. El back es un proyecto de Supabase (Auth, PostgreSQL, RLS) **administrado por otras
personas**: aquí no hay migraciones ni cambios de esquema. Ver `docs/supabase-esquema-actual.md`.

## Ramas (Gitflow)

| Rama | Uso |
|------|-----|
| `main` | Producción: **Netlify publica cada cambio**. Solo recibe merges revisados desde `develop` |
| `develop` | Integración |
| `feature/NNN-nombre` | Una por feature de Spec Kit (por ejemplo, `feature/001-autenticacion-admin`), creada desde `develop` y fusionada por PR |

## Desarrollo guiado por especificaciones (Spec Kit)

Orden de lectura:

1. `.specify/memory/constitution.md`: principios no negociables (incluye "back externo, solo front").
2. `docs/analisis-mvp.md`: decisiones, inconsistencias resueltas, mensajes exactos e integración con el repo existente.
3. `docs/supabase-esquema-actual.md`: el back real (solo lectura) y una nota de permisos para su equipo.
4. `specs/<feature>/`: `spec.md` → `plan.md` (+ `research.md`, `data-model.md`, `contracts/`, `quickstart.md`) → `tasks.md`.

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
