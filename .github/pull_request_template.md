## Descripción

<!-- Qué cambia y por qué. -->

**Feature / tareas**: `specs/NNN-…` · T___, T___
**Historias de usuario**: HU__

## Checklist (AGENTS.md §5, Definition of Done)

- [ ] El cambio está respaldado por la spec y las tareas (`spec.md` / `plan.md` / `contracts/` / `tasks.md` actualizados si cambió el comportamiento)
- [ ] Tareas marcadas `[x]` en `tasks.md`
- [ ] `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde
- [ ] Pruebas nuevas para cada regla de negocio tocada
- [ ] UI fiel al prototipo o mock, en español, responsive y accesible
- [ ] Sin secretos versionados
- [ ] ¿Cambia el back de Supabase? ☐ No · ☐ Sí → completar la sección 🔴 de abajo
- [ ] Docs sincronizadas según la matriz anti-desalineación (AGENTS.md §7)
- [ ] `CHANGELOG.md` actualizado en `[Unreleased]`
- [ ] PR hacia `develop` (nunca hacia `main`)

## 🔴 Cambio en el back (CRITICIDAD ALTA): solo si aplica

> El título del PR debe empezar con `[CRITICIDAD ALTA]`.

- **Solicitud**: `docs/cambios-back/CB-___-….md` · **Migración**: `supabase/migrations/…_cb____….sql`
- [ ] Reversión documentada y probada (o justificada)
- [ ] Probado en Supabase local, si aplica
- [ ] **✅ Check de autorización**: autorizado por ________ el ________ (explícito: "Autorizo CB-___")
- [ ] Aplicado **después** de la autorización y registrado en el CB
- [ ] `docs/supabase-esquema-actual.md`, `database.types.ts`, specs y `CHANGELOG.md` (`[CRITICIDAD ALTA]`) actualizados

## Validación manual

<!-- Pasos del quickstart.md ejecutados y resultado. -->
