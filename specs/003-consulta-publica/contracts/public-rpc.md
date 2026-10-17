# Contrato: función pública (003)

Migración: `supabase/migrations/20261017000300_consulta_publica.sql`. Requiere las tablas de la 002.

```sql
create or replace function public.listar_parqueaderos_publicos()
returns table (
  id               uuid,
  nombre           text,
  direccion        text,
  latitud          numeric,
  longitud         numeric,
  telefono         text,
  correo_contacto  text,
  horario_atencion text,
  ofertas          jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.nombre,
    p.direccion,
    p.latitud,
    p.longitud,
    p.telefono,
    p.correo_contacto,
    p.horario_atencion,
    jsonb_agg(
      jsonb_build_object(
        'tipo',               o.tipo,
        'tarifa_hora',        o.tarifa_hora,
        'capacidad_total',    o.capacidad_total,
        'celdas_disponibles', o.capacidad_total - o.celdas_ocupadas
      )
      order by o.tipo
    ) as ofertas
  from public.parqueaderos p
  join public.ofertas_vehiculo o on o.parqueadero_id = p.id
  where p.estado = 'activo'
  group by p.id
  having sum(o.capacidad_total) > 0
  order by p.nombre;
$$;

comment on function public.listar_parqueaderos_publicos() is
  'MedaPark HU9/HU10: parqueaderos publicables (activos y con capacidad total > 0), solo columnas públicas.';

revoke execute on function public.listar_parqueaderos_publicos() from public;
grant execute on function public.listar_parqueaderos_publicos() to anon, authenticated;
```

## Respuesta (PostgREST `rpc('listar_parqueaderos_publicos')`)

```json
[
  {
    "id": "3f0c…",
    "nombre": "Parqueadero Centro",
    "direccion": "Calle 50 # 45-10, Medellín",
    "latitud": 6.2442,
    "longitud": -75.5812,
    "telefono": "3001234567",
    "correo_contacto": "contacto@dominio.com",
    "horario_atencion": "Lunes a Domingo, 6:00 a.m. - 10:00 p.m.",
    "ofertas": [
      { "tipo": "automovil",   "tarifa_hora": 5000, "capacidad_total": 20, "celdas_disponibles": 12 },
      { "tipo": "motocicleta", "tarifa_hora": 2000, "capacidad_total": 15, "celdas_disponibles": 8 }
    ]
  }
]
```

- `ofertas` contiene **todos** los tipos atendidos (incluso uno con capacidad 0 si el otro tiene > 0), en el
  orden `automovil`, `motocicleta`.
- `correo_contacto` puede ser `null`.
- `latitud` y `longitud` llegan como número (`numeric` serializado). Convertir con `Number()` por seguridad.

## Tipos TypeScript (`src/features/publico/types.ts`)

```ts
import type { TipoVehiculo } from '../parqueadero/types';

export type OfertaPublica = {
  tipo: TipoVehiculo;
  tarifa_hora: number;
  capacidad_total: number;
  celdas_disponibles: number;
};

export type ParqueaderoPublico = {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono: string;
  correo_contacto: string | null;
  horario_atencion: string;
  ofertas: OfertaPublica[];
};
```

## Pruebas pgTAP: `supabase/tests/003_publico.test.sql`

| # | Caso | Esperado |
|---|------|----------|
| 1 | Como `anon`, `listar_parqueaderos_publicos()` ejecuta | sin error (`lives_ok`) |
| 2 | Datos: A (activo, autos 20/8 ocupadas), B (inactivo, 10), C (activo, capacidad 0), D (activo, motos 5/5 ocupadas) | devuelve exactamente A y D, en orden por nombre (`results_eq`) |
| 3 | `ofertas` de A | `celdas_disponibles = 12` |
| 4 | D (lleno) | presente con `celdas_disponibles = 0` |
| 5 | Columnas del resultado | no incluyen `admin_id` (`hasnt_column` no aplica a funciones; verificar con `results_eq` sobre las claves de `to_jsonb(r)`) |
| 6 | `anon` hace `select * from public.parqueaderos` | `throws_ok` con `42501` |
| 7 | A se cambia a `inactivo` (como `postgres`) y se repite la consulta | devuelve solo D |
