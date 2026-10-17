# Contrato: esquema SQL, RLS y RPC (002)

Migración: `supabase/migrations/20261017000200_parqueaderos.sql`. Requiere `public.es_sesion_aal2()` (001).

El SQL es **normativo**: el implementador puede ajustar el formato, pero no la semántica, los nombres
públicos (tablas, columnas, funciones, parámetros) ni los códigos de error.

## 1. Tipos, tablas y triggers

```sql
create type public.tipo_vehiculo as enum ('automovil', 'motocicleta');
create type public.estado_parqueadero as enum ('activo', 'inactivo');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.parqueaderos (
  id               uuid primary key default gen_random_uuid(),
  admin_id         uuid not null unique references auth.users (id) on delete cascade,
  nombre           text not null check (char_length(btrim(nombre)) between 3 and 100),
  estado           public.estado_parqueadero not null default 'activo',
  direccion        text not null check (char_length(btrim(direccion)) between 5 and 200),
  latitud          numeric(9, 6) not null check (latitud between -90 and 90),
  longitud         numeric(9, 6) not null check (longitud between -180 and 180),
  telefono         text not null check (telefono ~ '^[0-9]{7,10}$'),
  correo_contacto  text check (
                     correo_contacto is null
                     or correo_contacto ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
                   ),
  horario_atencion text not null check (char_length(btrim(horario_atencion)) between 3 and 120),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger parqueaderos_set_updated_at
  before update on public.parqueaderos
  for each row execute function public.set_updated_at();

create table public.ofertas_vehiculo (
  parqueadero_id  uuid not null references public.parqueaderos (id) on delete cascade,
  tipo            public.tipo_vehiculo not null,
  tarifa_hora     integer not null check (tarifa_hora between 1 and 999999),
  capacidad_total integer not null check (capacidad_total between 0 and 9999),
  celdas_ocupadas integer not null default 0 check (celdas_ocupadas >= 0),
  updated_at      timestamptz not null default now(),
  primary key (parqueadero_id, tipo),
  constraint ocupadas_no_superan_capacidad check (celdas_ocupadas <= capacidad_total)
);

create trigger ofertas_vehiculo_set_updated_at
  before update on public.ofertas_vehiculo
  for each row execute function public.set_updated_at();

comment on table public.parqueaderos is 'MedaPark HU3: un parqueadero por administrador.';
comment on table public.ofertas_vehiculo is 'MedaPark HU3/HU6/HU7: tarifa, capacidad y ocupación por tipo atendido.';
```

## 2. Privilegios y RLS

```sql
alter table public.parqueaderos enable row level security;
alter table public.ofertas_vehiculo enable row level security;

-- Escrituras solo vía RPC; lectura directa solo para authenticated (filtrada por RLS)
revoke all on public.parqueaderos, public.ofertas_vehiculo from anon, authenticated;
grant select on public.parqueaderos, public.ofertas_vehiculo to authenticated;

create policy "parqueaderos: el dueño lee el suyo"
  on public.parqueaderos for select to authenticated
  using (admin_id = (select auth.uid()));

create policy "parqueaderos: exige aal2"
  on public.parqueaderos as restrictive for all to authenticated
  using ((select public.es_sesion_aal2()));

create policy "ofertas: el dueño lee las suyas"
  on public.ofertas_vehiculo for select to authenticated
  using (exists (
    select 1 from public.parqueaderos p
    where p.id = parqueadero_id and p.admin_id = (select auth.uid())
  ));

create policy "ofertas: exige aal2"
  on public.ofertas_vehiculo as restrictive for all to authenticated
  using ((select public.es_sesion_aal2()));
```

## 3. RPC (todas `security definer`, `set search_path = ''`)

### Convenciones

- Primera instrucción de cada función:
  ```sql
  if not public.es_sesion_aal2() then
    raise exception 'NO_AUTENTICADO_AAL2' using errcode = '42501';
  end if;
  ```
- Errores de negocio: `raise exception '<CODIGO>';` (SQLSTATE `P0001`, `error.message = '<CODIGO>'`).
- Formato de `p_ofertas` (jsonb, arreglo de 1 o 2 elementos, sin tipos repetidos):
  `[{"tipo":"automovil","tarifa_hora":5000,"capacidad_total":50}, …]`
- Validación común de `p_ofertas` (puede ir en una función interna `public._validar_ofertas(jsonb)`
  `immutable`, sin `grant` a los clientes):
  - `null`, no arreglo o vacío → `SIN_TIPOS`;
  - tipos repetidos o un `tipo` fuera del enum → `DATOS_INVALIDOS`.
  ```sql
  create or replace function public._validar_ofertas(p_ofertas jsonb)
  returns void
  language plpgsql
  immutable
  set search_path = ''
  as $$
  begin
    if p_ofertas is null or jsonb_typeof(p_ofertas) <> 'array' or jsonb_array_length(p_ofertas) = 0 then
      raise exception 'SIN_TIPOS';
    end if;
    if jsonb_array_length(p_ofertas) > 2
       or (select count(distinct o ->> 'tipo') from jsonb_array_elements(p_ofertas) o)
          <> jsonb_array_length(p_ofertas)
       or exists (select 1 from jsonb_array_elements(p_ofertas) o
                  where coalesce(o ->> 'tipo', '') not in ('automovil', 'motocicleta')) then
      raise exception 'DATOS_INVALIDOS';
    end if;
  end;
  $$;
  ```
- Nota: Supabase concede por defecto `EXECUTE` a `anon` y `authenticated` sobre las funciones nuevas de
  `public`, y privilegios sobre las tablas nuevas. Por eso los `revoke` de §2 y §3.5 son **obligatorios**.
- Bloque `exception` final de las funciones de escritura:
  `when check_violation or not_null_violation or invalid_text_representation or numeric_value_out_of_range
  or invalid_parameter_value then raise exception 'DATOS_INVALIDOS';`

### 3.1 `registrar_parqueadero` (HU3)

```sql
create or replace function public.registrar_parqueadero(
  p_nombre           text,
  p_direccion        text,
  p_latitud          numeric,
  p_longitud         numeric,
  p_telefono         text,
  p_correo_contacto  text,
  p_horario_atencion text,
  p_ofertas          jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.es_sesion_aal2() then
    raise exception 'NO_AUTENTICADO_AAL2' using errcode = '42501';
  end if;

  if exists (select 1 from public.parqueaderos where admin_id = auth.uid()) then
    raise exception 'PARQUEADERO_YA_EXISTE';
  end if;

  perform public._validar_ofertas(p_ofertas);

  insert into public.parqueaderos
    (admin_id, nombre, direccion, latitud, longitud, telefono, correo_contacto, horario_atencion)
  values
    (auth.uid(), btrim(p_nombre), btrim(p_direccion), round(p_latitud, 6), round(p_longitud, 6),
     btrim(p_telefono), nullif(lower(btrim(coalesce(p_correo_contacto, ''))), ''), btrim(p_horario_atencion))
  returning id into v_id;

  insert into public.ofertas_vehiculo (parqueadero_id, tipo, tarifa_hora, capacidad_total)
  select v_id, (o ->> 'tipo')::public.tipo_vehiculo, (o ->> 'tarifa_hora')::integer,
         (o ->> 'capacidad_total')::integer
  from jsonb_array_elements(p_ofertas) as o;

  return v_id;
exception
  when unique_violation then raise exception 'PARQUEADERO_YA_EXISTE';
  when check_violation or not_null_violation or invalid_text_representation
       or numeric_value_out_of_range or invalid_parameter_value then
    raise exception 'DATOS_INVALIDOS';
end;
$$;
```

Resultado: el `id` del parqueadero creado (estado `activo` y `celdas_ocupadas = 0` en cada oferta).

### 3.2 `actualizar_parqueadero` (HU5)

Firma: los mismos parámetros que 3.1 más `p_estado public.estado_parqueadero` (después de
`p_horario_atencion`). `returns void`.

Algoritmo (en una sola transacción):

1. Comprobar `aal2`.
2. `select id into v_id from public.parqueaderos where admin_id = auth.uid() for update;` y, si es `null`,
   `PARQUEADERO_NO_EXISTE`.
3. `perform 1 from public.ofertas_vehiculo where parqueadero_id = v_id for update;` (bloquea frente a
   ingresos y salidas concurrentes).
4. `perform public._validar_ofertas(p_ofertas);`
5. Si existe una oferta guardada cuyo `tipo` **no** está en `p_ofertas` y su `capacidad_total > 0` →
   `TIPO_CON_CELDAS`.
6. Si existe una oferta guardada cuyo tipo sí está en `p_ofertas` y la nueva `capacidad_total` es menor que
   `celdas_ocupadas` → `CAPACIDAD_MENOR_A_OCUPADAS`.
7. `update public.parqueaderos set nombre, estado, direccion, latitud, longitud, telefono, correo_contacto,
   horario_atencion` (con la misma normalización que 3.1) `where id = v_id`.
8. `delete from public.ofertas_vehiculo where parqueadero_id = v_id and tipo` no está en `p_ofertas`.
9. `insert … on conflict (parqueadero_id, tipo) do update set tarifa_hora = excluded.tarifa_hora,
   capacidad_total = excluded.capacidad_total` (las ofertas nuevas inician con `celdas_ocupadas = 0`; las
   existentes conservan sus ocupadas).

### 3.3 `configurar_celdas` (HU6)

```text
public.configurar_celdas(p_capacidades jsonb) returns void
p_capacidades: [{"tipo":"automovil","capacidad_total":50}, …]   (1..2 elementos, sin repetir)
```

1. `aal2`, `v_id` por `auth.uid()` (`PARQUEADERO_NO_EXISTE`) y bloqueo de las ofertas (`for update`).
2. Si es `null`, vacío o tiene tipos repetidos → `DATOS_INVALIDOS`.
3. Por cada elemento: si el tipo no tiene oferta → `TIPO_NO_ATENDIDO`; si `capacidad_total <
   celdas_ocupadas` → `CAPACIDAD_MENOR_A_OCUPADAS`.
4. `update public.ofertas_vehiculo set capacidad_total = …` para cada tipo enviado. Los tipos no enviados
   no cambian.

### 3.4 `registrar_ingreso` / `registrar_salida` (HU7)

```sql
create or replace function public.registrar_ingreso(p_tipo public.tipo_vehiculo)
returns public.ofertas_vehiculo
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id  uuid;
  v_row public.ofertas_vehiculo;
begin
  if not public.es_sesion_aal2() then
    raise exception 'NO_AUTENTICADO_AAL2' using errcode = '42501';
  end if;

  select id into v_id from public.parqueaderos where admin_id = auth.uid();
  if v_id is null then
    raise exception 'PARQUEADERO_NO_EXISTE';
  end if;

  update public.ofertas_vehiculo
     set celdas_ocupadas = celdas_ocupadas + 1
   where parqueadero_id = v_id
     and tipo = p_tipo
     and celdas_ocupadas < capacidad_total
  returning * into v_row;

  if not found then
    if not exists (select 1 from public.ofertas_vehiculo where parqueadero_id = v_id and tipo = p_tipo) then
      raise exception 'TIPO_NO_ATENDIDO';
    end if;
    raise exception 'SIN_CELDAS_DISPONIBLES';
  end if;

  return v_row;
end;
$$;
```

`registrar_salida` es idéntica salvo `set celdas_ocupadas = celdas_ocupadas - 1`, la condición
`celdas_ocupadas > 0` y el error `SIN_CELDAS_OCUPADAS`.

### 3.5 Permisos de ejecución

```sql
revoke execute on function
  public.registrar_parqueadero(text, text, numeric, numeric, text, text, text, jsonb),
  public.actualizar_parqueadero(text, text, numeric, numeric, text, text, text, public.estado_parqueadero, jsonb),
  public.configurar_celdas(jsonb),
  public.registrar_ingreso(public.tipo_vehiculo),
  public.registrar_salida(public.tipo_vehiculo)
from public, anon;

grant execute on function
  public.registrar_parqueadero(text, text, numeric, numeric, text, text, text, jsonb),
  public.actualizar_parqueadero(text, text, numeric, numeric, text, text, text, public.estado_parqueadero, jsonb),
  public.configurar_celdas(jsonb),
  public.registrar_ingreso(public.tipo_vehiculo),
  public.registrar_salida(public.tipo_vehiculo)
to authenticated;

revoke execute on function public._validar_ofertas(jsonb) from public, anon, authenticated;
```

## 4. Pruebas pgTAP

Archivos en `supabase/tests/`. Cada uno con `begin; select plan(n); … select * from finish(); rollback;`.

**Fixture común** (al inicio de cada archivo, como `postgres`):

```sql
insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'a@test.co', 'authenticated', 'authenticated'),
       ('22222222-2222-2222-2222-222222222222', 'b@test.co', 'authenticated', 'authenticated');

-- Helper local para simular sesión
create or replace function pg_temp.como(p_uid uuid, p_aal text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', p_aal)::text, true);
$$;
-- Luego: set local role authenticated; select pg_temp.como('1111…', 'aal2');
```

| Archivo | Casos mínimos |
|---------|---------------|
| `002_schema.test.sql` | existen las tablas, los enums y RLS habilitado (`tables_are`, `has_type`, `results_eq` sobre `pg_class.relrowsecurity`); los `CHECK` rechazan `celdas_ocupadas > capacidad_total`, `telefono` con letras, latitud 91 y `tarifa_hora` 0; el `UNIQUE(admin_id)` |
| `002_rls.test.sql` | A aal2 ve solo el suyo (1 fila); A aal2 no ve el de B (0 filas); A aal1 ve 0 filas; `anon` → `permission denied` en `select`; `authenticated` → `permission denied` en `insert`/`update`/`delete` directos |
| `002_rpc_registrar.test.sql` | camino feliz (estado `activo`, ocupadas 0, 2 ofertas); segundo registro → `PARQUEADERO_YA_EXISTE`; ofertas vacías → `SIN_TIPOS`; tipo repetido → `DATOS_INVALIDOS`; teléfono inválido → `DATOS_INVALIDOS`; aal1 → `NO_AUTENTICADO_AAL2`; el correo vacío se guarda `null` |
| `002_rpc_actualizar.test.sql` | cambio a `inactivo`; quitar un tipo con capacidad > 0 → `TIPO_CON_CELDAS`; quitar un tipo con capacidad 0 → OK; capacidad < ocupadas → `CAPACIDAD_MENOR_A_OCUPADAS` **sin** cambios en `nombre` (atomicidad); agregar un tipo nuevo → ocupadas 0; B no puede modificar el de A (B sin parqueadero → `PARQUEADERO_NO_EXISTE`) |
| `002_rpc_celdas.test.sql` | aumentar; reducir a ≥ ocupadas; reducir < ocupadas → error; tipo no atendido → `TIPO_NO_ATENDIDO`; 0 con ocupadas 0 → OK |
| `002_rpc_ocupacion.test.sql` | ingreso +1; ingreso con lleno → `SIN_CELDAS_DISPONIBLES`; salida −1; salida con 0 → `SIN_CELDAS_OCUPADAS`; tipo no atendido → `TIPO_NO_ATENDIDO`; aal1 → `NO_AUTENTICADO_AAL2` |

Para afirmar errores: `select throws_ok($$ select public.registrar_ingreso('automovil') $$, 'P0001', 'SIN_CELDAS_DISPONIBLES');`
