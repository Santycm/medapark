<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
of the feature being implemented (match `.specify/feature.json` / current branch):

- `feature/001-autenticacion-admin` → `specs/001-autenticacion-admin/plan.md` (migración a TS + auth; implementar primero)
- `feature/002-gestion-parqueadero` → `specs/002-gestion-parqueadero/plan.md`
- `feature/003-consulta-publica` → `specs/003-consulta-publica/plan.md`

Always read `.specify/memory/constitution.md`, `docs/analisis-mvp.md` and `docs/supabase-esquema-actual.md`
before implementing. Implementation order is strictly 001 → 002 → 003.
<!-- SPECKIT END -->

## Reglas del proyecto (no negociables)

- Este repo es **solo front**. El back (Supabase `Medapark`) lo administran otras personas: **nunca** crear
  migraciones, SQL, políticas, permisos ni cambiar configuración en Supabase. Solo lectura
  (`supabase gen types`, `select`).
- **Nunca** hacer push a `main` (Netlify publica automáticamente). Gitflow: `develop` + `feature/NNN-nombre`.
- No eliminar las pantallas existentes fuera del MVP (recuperar contraseña, perfil, SetupMfa): se conservan sin enlaces.
