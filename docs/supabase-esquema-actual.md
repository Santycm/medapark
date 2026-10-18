# Esquema actual de Supabase (proyecto `Medapark`)

**Proyecto**: `msmfidnqmqntxbcucnsf` (us-west-2, PostgreSQL 17) · **Leído**: 2026-10-17
**Método**: solo lectura (`supabase gen types` + `supabase db query` con `SELECT` sobre el catálogo). No se
modificó nada.
**Datos al momento de la lectura**: 5 filas en `parking_lots` y 10 en `parking_vehicle_configs` (datos de
prueba del equipo; no se leyó su contenido).

> 🔴 **Regla del proyecto**: el equipo administra el back. **Todo cambio en él es de CRITICIDAD ALTA y
> requiere un check de autorización explícito** antes de ejecutarse (`docs/cambios-back/README.md`). Las
> lecturas no requieren autorización. Ver la constitución, Principio II.

## 1. DDL reconstruido (baseline)

Este SQL es **solo documentación** del estado actual (referencia para el front). No se ejecuta.

```sql
-- Tablas -------------------------------------------------------------------
create table public.parking_lots (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid not null unique references auth.users (id) on delete restrict,
  name          text not null check (length(trim(both from name)) > 0),
  status        boolean not null default true,            -- true = Activo, false = Inactivo
  address       text not null check (length(trim(both from address)) > 0),
  latitude      double precision not null check (latitude >= -90 and latitude <= 90),
  longitude     double precision not null check (longitude >= -180 and longitude <= 180),
  phone         text not null check (length(trim(both from phone)) > 0),
  contact_email text constraint parking_lots_contact_email_format check (
                  contact_email is null
                  or contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  opening_hours text not null check (length(trim(both from opening_hours)) > 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.parking_vehicle_configs (
  id              uuid primary key default gen_random_uuid(),
  parking_lot_id  uuid not null references public.parking_lots (id) on delete restrict,
  vehicle_type    text not null constraint parking_vehicle_configs_vehicle_type_check
                    check (vehicle_type = any (array['CAR', 'MOTORCYCLE'])),
  hourly_rate     integer not null check (hourly_rate > 0),
  total_spaces    integer not null default 0 check (total_spaces >= 0),
  occupied_spaces integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint parking_vehicle_configs_check check (occupied_spaces >= 0 and occupied_spaces <= total_spaces),
  constraint parking_vehicle_configs_unique_type unique (parking_lot_id, vehicle_type)
);

-- Trigger updated_at -------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path to '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger parking_lots_set_updated_at before update on public.parking_lots
  for each row execute function public.set_updated_at();
create trigger parking_vehicle_configs_set_updated_at before update on public.parking_vehicle_configs
  for each row execute function public.set_updated_at();

-- Vista pública (sin security_invoker: se ejecuta con los permisos del dueño) ---
create view public.public_parking_lots as
select p.id, p.name, p.address, p.latitude, p.longitude, p.phone, p.contact_email, p.opening_hours,
       car.hourly_rate  as car_hourly_rate,
       car.total_spaces as car_total_spaces,
       car.occupied_spaces as car_occupied_spaces,
       case when car.id is not null then car.total_spaces - car.occupied_spaces else null::integer end
         as car_available_spaces,
       moto.hourly_rate  as motorcycle_hourly_rate,
       moto.total_spaces as motorcycle_total_spaces,
       moto.occupied_spaces as motorcycle_occupied_spaces,
       case when moto.id is not null then moto.total_spaces - moto.occupied_spaces else null::integer end
         as motorcycle_available_spaces
from public.parking_lots p
left join public.parking_vehicle_configs car  on car.parking_lot_id = p.id  and car.vehicle_type = 'CAR'
left join public.parking_vehicle_configs moto on moto.parking_lot_id = p.id and moto.vehicle_type = 'MOTORCYCLE'
where p.status = true
  and (car.id is not null and car.total_spaces > 0 or moto.id is not null and moto.total_spaces > 0);

-- RLS ----------------------------------------------------------------------
alter table public.parking_lots enable row level security;
alter table public.parking_vehicle_configs enable row level security;

create policy parking_lots_select_own on public.parking_lots for select to authenticated
  using (admin_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2');
create policy parking_lots_insert_own on public.parking_lots for insert to authenticated
  with check (admin_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2');
create policy parking_lots_update_own on public.parking_lots for update to authenticated
  using (admin_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2')
  with check (admin_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2');

create policy vehicle_configs_select_own on public.parking_vehicle_configs for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1 from public.parking_lots p
    where p.id = parking_vehicle_configs.parking_lot_id and p.admin_id = (select auth.uid())));
create policy vehicle_configs_insert_own on public.parking_vehicle_configs for insert to authenticated
  with check ((select auth.jwt() ->> 'aal') = 'aal2' and total_spaces > 0 and occupied_spaces = 0 and exists (
    select 1 from public.parking_lots p
    where p.id = parking_vehicle_configs.parking_lot_id and p.admin_id = (select auth.uid())));
create policy vehicle_configs_update_own on public.parking_vehicle_configs for update to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1 from public.parking_lots p
    where p.id = parking_vehicle_configs.parking_lot_id and p.admin_id = (select auth.uid())))
  with check ((select auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1 from public.parking_lots p
    where p.id = parking_vehicle_configs.parking_lot_id and p.admin_id = (select auth.uid())));
create policy vehicle_configs_delete_own on public.parking_vehicle_configs for delete to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2' and total_spaces = 0 and occupied_spaces = 0 and exists (
    select 1 from public.parking_lots p
    where p.id = parking_vehicle_configs.parking_lot_id and p.admin_id = (select auth.uid())));

-- Privilegios observados (anon / authenticated) --------------------------------
-- parking_lots:            authenticated: SELECT
-- parking_vehicle_configs: authenticated: SELECT, DELETE
-- public_parking_lots:     anon y authenticated: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
--                          (privilegios por defecto de Supabase; la vista no es actualizable por sus JOIN)

-- RPC de ocupación (SECURITY DEFINER, EXECUTE solo authenticated/service_role) ---
-- public.register_vehicle_entry(p_vehicle_config_id uuid) returns integer
-- public.register_vehicle_exit(p_vehicle_config_id uuid)  returns integer
-- (cuerpo completo en §2)
```

## 2. Funciones de ocupación existentes

```sql
create or replace function public.register_vehicle_entry(p_vehicle_config_id uuid)
returns integer language plpgsql security definer set search_path to '' as $function$
declare
    v_occupied integer;
begin
    if auth.uid() is null
       or (auth.jwt() ->> 'aal') is distinct from 'aal2' then
        raise exception 'Se requiere una sesión autenticada con MFA.';
    end if;

    update public.parking_vehicle_configs as c
    set occupied_spaces = c.occupied_spaces + 1
    where c.id = p_vehicle_config_id
      and c.occupied_spaces < c.total_spaces
      and exists (select 1 from public.parking_lots as p
                  where p.id = c.parking_lot_id and p.admin_id = auth.uid())
    returning c.occupied_spaces into v_occupied;

    if not found then
        raise exception
            'No se pudo registrar el ingreso: configuración inexistente, ajena o sin capacidad disponible.';
    end if;

    return v_occupied;
end;
$function$;

-- register_vehicle_exit: idéntica con "occupied_spaces - 1", condición "occupied_spaces > 0" y el mensaje
-- 'No se pudo registrar la salida: configuración inexistente, ajena o sin celdas ocupadas.'
```

## 3. Cómo usa el front este back (sin cambios en la BD)

| Necesidad del front | Objeto del back | HU |
|---------------------|-----------------|----|
| Leer el parqueadero propio y sus configuraciones | `select` sobre `parking_lots` + `parking_vehicle_configs` (RLS: dueño + aal2) | HU4 |
| Registrar parqueadero | `insert` en `parking_lots` (con `admin_id = auth.uid()`) y luego `insert` de 1 o 2 filas en `parking_vehicle_configs` | HU3 |
| Editar parqueadero | `update` en `parking_lots`; `update`/`insert`/`delete` en `parking_vehicle_configs` | HU5 |
| Configurar celdas | `update` de `total_spaces` en `parking_vehicle_configs` | HU6 |
| Ingreso / salida | RPC `register_vehicle_entry` / `register_vehicle_exit` (`p_vehicle_config_id`) | HU7 |
| Mapa y detalle públicos | `select` sobre la vista `public_parking_lots` | HU9, HU10, HU11 |

Reglas que el back **ya garantiza** (y el front respeta): 1 parqueadero por admin (`UNIQUE admin_id`),
`0 ≤ occupied_spaces ≤ total_spaces`, `hourly_rate > 0`, una fila por tipo, tipos `CAR`/`MOTORCYCLE`,
coordenadas en rango, formato de correo, eliminar un tipo solo con `total_spaces = 0` y `occupied_spaces = 0`,
crear un tipo solo con `total_spaces > 0` y que todo acceso del admin exija dueño + `aal2`.

Reglas que valida **solo el front** (el back no las expresa): teléfono solo con dígitos (7–10), longitudes de
texto, al menos un tipo atendido, aviso de coordenadas fuera de Medellín y la secuencia de guardado de la
edición (ver la spec 002).

## 4. Brechas conocidas → solicitudes de cambio

No quedan brechas conocidas. La lectura del 2026-10-17 (`has_table_privilege`) sugería que `authenticated` no tenía `INSERT`/`UPDATE` en `parking_lots` ni en `parking_vehicle_configs`, y se propuso la solicitud [`CB-001`](cambios-back/CB-001-permisos-escritura-admin.md). **Resultó no requerida**: en la prueba manual contra el back real, registrar, consultar y editar el parqueadero funcionaron sin aplicarla, así que no se ejecutó ningún cambio. Las políticas RLS ya limitan esas escrituras al dueño con sesión `aal2`. Observación menor: `anon` y `authenticated` tienen privilegios de escritura sobre la vista `public_parking_lots` (no es actualizable por sus JOIN, así que no hay impacto funcional).

El front maneja `42501` mostrando "No tienes permisos para realizar esta acción. Contacta al administrador
del sistema." sin romperse.
