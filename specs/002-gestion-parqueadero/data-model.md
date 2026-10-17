# Data Model: Gestión del Parqueadero (002)

SQL definitivo en [contracts/db-schema.md](./contracts/db-schema.md). Aquí se describen las entidades, las
reglas y los estados.

## Diagrama

```text
auth.users (001) 1 ──── 0..1 public.parqueaderos 1 ──── 1..2 public.ofertas_vehiculo
                         (admin_id UNIQUE)               (PK parqueadero_id + tipo)
```

## Enums

| Enum | Valores | Etiqueta en UI |
|------|---------|----------------|
| `public.tipo_vehiculo` | `automovil`, `motocicleta` | Automóvil(es), Motocicleta(s) |
| `public.estado_parqueadero` | `activo`, `inactivo` | Activo, Inactivo |

## `public.parqueaderos`

| Columna | Tipo | Nulo | Default | Regla (CHECK / lógica) | Origen |
|---------|------|------|---------|------------------------|--------|
| `id` | uuid | no | `gen_random_uuid()` | PK | |
| `admin_id` | uuid | no | | FK `auth.users(id)` `on delete cascade`; **UNIQUE** | HU3: 1 parqueadero por cuenta |
| `nombre` | text | no | | `char_length(btrim(nombre)) between 3 and 100` | HU3 |
| `estado` | `estado_parqueadero` | no | `'activo'` | | HU3 y HU5 |
| `direccion` | text | no | | `char_length(btrim(direccion)) between 5 and 200` | HU3 |
| `latitud` | numeric(9,6) | no | | `between -90 and 90` | HU3 |
| `longitud` | numeric(9,6) | no | | `between -180 and 180` | HU3 |
| `telefono` | text | no | | `telefono ~ '^[0-9]{7,10}$'` | HU3 |
| `correo_contacto` | text | sí | | null o `~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'` | HU3 (opcional) |
| `horario_atencion` | text | no | | `char_length(btrim(horario_atencion)) between 3 and 120` | HU3 (texto libre) |
| `created_at` | timestamptz | no | `now()` | | |
| `updated_at` | timestamptz | no | `now()` | trigger `set_updated_at` | |

## `public.ofertas_vehiculo`

| Columna | Tipo | Nulo | Default | Regla | Origen |
|---------|------|------|---------|-------|--------|
| `parqueadero_id` | uuid | no | | FK `parqueaderos(id)` `on delete cascade`; PK (1/2) | |
| `tipo` | `tipo_vehiculo` | no | | PK (2/2) | HU3: tipos atendidos |
| `tarifa_hora` | integer | no | | `between 1 and 999999` (COP) | HU3: solo tarifa por hora |
| `capacidad_total` | integer | no | | `between 0 and 9999` | HU6 |
| `celdas_ocupadas` | integer | no | `0` | `>= 0` y `<= capacidad_total` | HU7 |
| `updated_at` | timestamptz | no | `now()` | trigger `set_updated_at` | |

**Derivado**: `celdas_disponibles = capacidad_total − celdas_ocupadas` (se calcula en el cliente y en las
consultas públicas; no se almacena).

## Reglas que cruzan filas (garantizadas por las RPC)

| Regla | Dónde | Código de error |
|-------|-------|-----------------|
| Máximo 1 parqueadero por administrador | `UNIQUE(admin_id)` + `registrar_parqueadero` | `PARQUEADERO_YA_EXISTE` |
| Al menos 1 oferta (tipo atendido) por parqueadero | `registrar_parqueadero`, `actualizar_parqueadero` | `SIN_TIPOS` |
| No quitar un tipo cuya `capacidad_total` guardada sea > 0 | `actualizar_parqueadero` | `TIPO_CON_CELDAS` |
| `capacidad_total` nueva ≥ `celdas_ocupadas` actuales | `actualizar_parqueadero`, `configurar_celdas` | `CAPACIDAD_MENOR_A_OCUPADAS` |
| Ingreso solo si `celdas_ocupadas < capacidad_total` | `registrar_ingreso` | `SIN_CELDAS_DISPONIBLES` |
| Salida solo si `celdas_ocupadas > 0` | `registrar_salida` | `SIN_CELDAS_OCUPADAS` |
| Operar solo sobre el propio parqueadero | Todas (resuelven por `auth.uid()`) | `PARQUEADERO_NO_EXISTE` |
| Solo con sesión aal2 | Todas | `NO_AUTENTICADO_AAL2` |

## Publicabilidad (regla derivada, la consume la feature 003)

```text
publicable(p) = p.estado = 'activo' AND SUM(ofertas.capacidad_total) > 0
```

| `estado` | Σ capacidad | ¿Publicable? | Aviso en el panel (FR-015) |
|----------|-------------|--------------|----------------------------|
| activo | > 0 | Sí | — |
| activo | 0 | No | Tu parqueadero no aparece en el mapa público porque no tiene celdas configuradas. |
| inactivo | cualquiera | No | Tu parqueadero está inactivo y no aparece en el mapa público. |

## Transiciones de estado

```text
(sin parqueadero) ──registrar_parqueadero──► activo
activo ◄──actualizar_parqueadero(p_estado)──► inactivo
```

Por cada oferta, `celdas_ocupadas`:

```text
n ──registrar_ingreso (n < capacidad)──► n+1
n ──registrar_salida  (n > 0)──────────► n−1
```

## Tipos en el frontend

Se generan con `npx supabase gen types typescript --linked > src/lib/database.types.ts` (se versiona).

```ts
// src/features/parqueadero/types.ts
import type { Tables, Enums } from '../../lib/database.types';
export type TipoVehiculo = Enums<'tipo_vehiculo'>;            // 'automovil' | 'motocicleta'
export type EstadoParqueadero = Enums<'estado_parqueadero'>;  // 'activo' | 'inactivo'
export type OfertaVehiculo = Tables<'ofertas_vehiculo'>;
export type Parqueadero = Tables<'parqueaderos'> & { ofertas_vehiculo: OfertaVehiculo[] };
export const TIPOS: readonly TipoVehiculo[] = ['automovil', 'motocicleta'];
export const ETIQUETA_TIPO = {
  automovil: { singular: 'Automóvil', plural: 'Automóviles' },
  motocicleta: { singular: 'Motocicleta', plural: 'Motocicletas' },
} as const;
```

## Esquema del formulario (`parqueaderoFormSchema`, Zod)

Todos los valores del formulario son `string` o `boolean`. Se aplica `trim` a todo y `normalizeDecimal` a
las coordenadas.

| Campo | Regla | Mensaje |
|-------|-------|---------|
| `nombre` | requerido; 3–100 | requerido → (resumen) · longitud → "Debe tener entre 3 y 100 caracteres." |
| `direccion` | requerido; 5–200 | "Debe tener entre 5 y 200 caracteres." |
| `latitud` | requerido; número; −90..90; ≤ 6 decimales | "Rango válido: -90 a 90." |
| `longitud` | requerido; número; −180..180; ≤ 6 decimales | "Rango válido: -180 a 180." |
| `telefono` | requerido; `^\d+$` | "Solo se permiten caracteres numéricos." · longitud 7–10 → "Debe tener entre 7 y 10 dígitos." |
| `correoContacto` | opcional; si tiene valor, formato email | "Debe tener un formato de correo electrónico válido." |
| `horarioAtencion` | requerido; 3–120 | "Debe tener entre 3 y 120 caracteres." |
| `atiendeAutomoviles`, `atiendeMotocicletas` | al menos uno `true` | (resumen) + resaltado del grupo |
| `tarifaAutomoviles` | requerido si `atiendeAutomoviles`; entero 1–999999 | "Ingresa un valor entero entre 1 y 999.999." |
| `capacidadAutomoviles` | requerido si `atiendeAutomoviles`; entero 0–9999 | "Valor numérico entero mayor o igual a 0." |
| `tarifaMotocicletas` / `capacidadMotocicletas` | análogos | análogos |
| `estado` (solo edición) | `'activo' \| 'inactivo'` | — |

- **Campos requeridos vacíos**: mensaje por campo "Este campo es obligatorio." y resumen "Debe completar los
  campos obligatorios" sobre los botones (FR-007).
- **Aviso no bloqueante** (fuera del esquema): `estaFueraDeMedellin(lat, lng)` → "La ubicación está fuera de
  Medellín. Verifica las coordenadas."
