# Contrato: helpers SQL (001)

Migración: `supabase/migrations/20261017000100_auth_helpers.sql`

```sql
-- Extensión para pruebas pgTAP (supabase test db)
create extension if not exists pgtap with schema extensions;

-- true solo si el JWT de la petición tiene aal = 'aal2' (ambos factores superados)
create or replace function public.es_sesion_aal2()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false);
$$;

comment on function public.es_sesion_aal2() is
  'MedaPark: true si la sesión superó ambos factores (HU2). Úsese en políticas RESTRICTIVE de tablas administrativas.';

revoke all on function public.es_sesion_aal2() from public;
grant execute on function public.es_sesion_aal2() to authenticated, anon;
```

## Uso esperado (feature 002)

```sql
create policy "admin: exige aal2"
  on public.parqueaderos
  as restrictive
  for all
  to authenticated
  using ((select public.es_sesion_aal2()))
  with check ((select public.es_sesion_aal2()));
```

## Pruebas pgTAP: `supabase/tests/001_auth_helpers.test.sql`

| # | Contexto (`request.jwt.claims`) | Esperado |
|---|---------------------------------|----------|
| 1 | `{"role":"authenticated","aal":"aal2"}` | `true` |
| 2 | `{"role":"authenticated","aal":"aal1"}` | `false` |
| 3 | `{"role":"anon"}` (sin `aal`) | `false` |
| 4 | claims vacíos `{}` | `false` |
| 5 | La función `public.es_sesion_aal2()` existe | `has_function` |

Esqueleto:

```sql
begin;
select plan(5);

select set_config('request.jwt.claims', '{"role":"authenticated","aal":"aal2"}', true);
select is(public.es_sesion_aal2(), true, 'aal2 → true');

select set_config('request.jwt.claims', '{"role":"authenticated","aal":"aal1"}', true);
select is(public.es_sesion_aal2(), false, 'aal1 → false');

select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is(public.es_sesion_aal2(), false, 'anon → false');

select set_config('request.jwt.claims', '{}', true);
select is(public.es_sesion_aal2(), false, 'sin claims → false');

select has_function('public', 'es_sesion_aal2', 'existe public.es_sesion_aal2()');

select * from finish();
rollback;
```
