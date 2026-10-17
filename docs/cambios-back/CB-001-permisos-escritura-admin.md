# CB-001: Permisos INSERT/UPDATE del administrador sobre su parqueadero

| Campo | Valor |
|-------|-------|
| **Criticidad** | 🔴 **ALTA** |
| **Estado** | ⏳ **Pendiente de autorización** (no ejecutado) |
| **Solicitado por** | Claude Code (sesión SDD) · 2026-10-17 |
| **Feature / HU** | `specs/002-gestion-parqueadero` · HU3 (registrar), HU5 (editar), HU6 (configurar celdas) |
| **Migración** | `supabase/migrations/<timestamp>_cb_001_permisos_escritura_admin.sql`. Se crea **solo** cuando la autorización esté aprobada |

## Motivo

La lectura de solo lectura del 2026-10-17 (`has_table_privilege`) mostró que el rol `authenticated` tiene
`SELECT` en `parking_lots` y `SELECT`/`DELETE` en `parking_vehicle_configs`, pero **no** `INSERT` ni `UPDATE`
en esas tablas. Las **políticas RLS** de insert y update ya existen (`parking_lots_insert_own`,
`parking_lots_update_own`, `vehicle_configs_insert_own` y `vehicle_configs_update_own`), así que falta solo el
privilegio. Sin él, el front de HU3, HU5 y HU6 recibe `42501 permission denied`.

## Cambio propuesto (SQL exacto)

```sql
grant insert, update on table public.parking_lots to authenticated;
grant insert, update on table public.parking_vehicle_configs to authenticated;
```

## Impacto

- Habilita el registro, la edición y la configuración de celdas desde la app.
- Las escrituras siguen limitadas por las políticas RLS existentes: solo el dueño (`admin_id = auth.uid()`),
  solo con sesión `aal2`, crear un tipo solo con `total_spaces > 0`, y el `CHECK` de ocupadas ≤ capacidad.
- `anon` no recibe ningún privilegio nuevo.
- No modifica datos existentes.

## Riesgos

- Bajo, porque la RLS ya filtra. Riesgo residual: una política RLS mal escrita quedaría expuesta. Se revisó la
  definición actual (`docs/supabase-esquema-actual.md` §1) y exige dueño + `aal2` en `USING` y `WITH CHECK`.
- `UPDATE` sobre `parking_vehicle_configs` permite cambiar `occupied_spaces` directamente (sin las RPC). Lo
  sigue acotando el `CHECK`. Si el equipo quiere que la ocupación cambie **solo** por las RPC, se puede
  restringir por columnas en lugar de toda la tabla:
  `grant update (hourly_rate, total_spaces) on public.parking_vehicle_configs to authenticated;`
  (**alternativa recomendada**; el front de la 002 solo actualiza esas dos columnas).

## Reversión (SQL exacto)

```sql
revoke insert, update on table public.parking_lots from authenticated;
revoke insert, update on table public.parking_vehicle_configs from authenticated;
```

## Pruebas

- [ ] Verificación posterior (solo lectura):
  `select has_table_privilege('authenticated','public.parking_lots','INSERT'), has_table_privilege('authenticated','public.parking_lots','UPDATE');`
- [ ] En la app: `quickstart.md` de la 002, §US1 (registro), §US4 (edición) y §US5 (celdas).
- [ ] Un admin con sesión `aal1` sigue sin poder escribir (RLS).

## ✅ Check de autorización (obligatorio antes de ejecutar)

- [ ] **Autorizado por**: ______________________ · **Fecha**: __________ · **Medio** (chat/PR): ________
- [ ] **Variante elegida**: ☐ tabla completa · ☐ por columnas (`hourly_rate`, `total_spaces`) en `parking_vehicle_configs`

> Sin esta casilla marcada por una persona responsable del back, **no se ejecuta**.

## Ejecución

- **Aplicado por**: ________ · **Fecha**: ________ · **Comando/medio**: ________
- **Resultado**:
- [ ] `docs/supabase-esquema-actual.md` actualizado
- [ ] `npm run gen:types` ejecutado
- [ ] Specs afectadas actualizadas (002: quitar la dependencia pendiente)
- [ ] `CHANGELOG.md` con `[CRITICIDAD ALTA]`
