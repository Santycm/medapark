# Contrato: uso del back existente (002)

El back **no se modifica** (`docs/supabase-esquema-actual.md`). Este contrato fija exactamente cómo lo usa el
front: consultas, payloads, orden de escritura y mapeo de errores. Todas las llamadas usan el cliente tipado
`supabase` de `src/lib/supabase.ts` (`Database` generado).

## 1. Tipos de dominio (`src/domain/parking.ts`)

```ts
import type { Tables } from '../lib/database.types';

export type VehicleType = 'CAR' | 'MOTORCYCLE';              // la columna es text con CHECK
export const VEHICLE_TYPES: readonly VehicleType[] = ['CAR', 'MOTORCYCLE'];
export const VEHICLE_LABEL = {
  CAR: { singular: 'Automóvil', plural: 'Automóviles' },
  MOTORCYCLE: { singular: 'Motocicleta', plural: 'Motocicletas' },
} as const;

export type VehicleConfig = Omit<Tables<'parking_vehicle_configs'>, 'vehicle_type'> & { vehicle_type: VehicleType };
export type ParkingLot = Tables<'parking_lots'> & { parking_vehicle_configs: VehicleConfig[] };
// status: true = Activo, false = Inactivo
```

## 2. Lectura del parqueadero propio (HU4)

```ts
const { data, error } = await supabase
  .from('parking_lots')
  .select('*, parking_vehicle_configs(*)')
  .maybeSingle();
```

- La RLS del back devuelve solo el parqueadero del usuario y solo con `aal2`. `data = null` significa "sin
  parqueadero" (no es un error).
- Ordenar las configuraciones en el cliente: `CAR` primero.

## 3. Registro (HU3): 2 pasos

```ts
// Paso 1
const { data: lot, error: e1 } = await supabase
  .from('parking_lots')
  .insert({
    admin_id: user.id,                 // obligatorio: lo exige la política parking_lots_insert_own
    name, address, latitude, longitude, phone,
    contact_email: email || null,
    opening_hours,
    status: true,
  })
  .select('id')
  .single();

// Paso 2 (solo si el paso 1 tuvo éxito); total_spaces >= 1 (lo exige vehicle_configs_insert_own)
const { error: e2 } = await supabase
  .from('parking_vehicle_configs')
  .insert(configs.map((c) => ({
    parking_lot_id: lot.id,
    vehicle_type: c.vehicle_type,
    hourly_rate: c.hourly_rate,
    total_spaces: c.total_spaces,
  })));
```

| Resultado | Comportamiento del front |
|-----------|--------------------------|
| Paso 1 con error `23505` (`parking_lots_admin_id_key`) | `MSG.parqueadero.yaExiste` → `recargar()` → `/admin` |
| Paso 1 OK, paso 2 con error | `MSG.parqueadero.registroIncompleto` → `recargar()` → `/admin` (el panel muestra el aviso "sin tipos") |
| Ambos OK | `recargar()` → `/admin` con `flash = MSG.parqueadero.registrado` |

## 4. Edición (HU5): validación previa + guardado secuencial

**Antes de escribir** se vuelve a leer el parqueadero (§2) para obtener las configuraciones actuales (`C`) y
se comparan con las deseadas (`D`):

| Regla (en este orden) | Si falla |
|-----------------------|----------|
| `D` tiene al menos 1 tipo | `MSG.parqueadero.requeridos` (grupo de tipos en rojo) |
| Cada tipo de `C` que no está en `D` tiene `total_spaces = 0` y `occupied_spaces = 0` | `MSG.parqueadero.quitarTipo` |
| Cada tipo presente en ambos: `D.total_spaces ≥ C.occupied_spaces` | `MSG.celdas.reducir` (campo de capacidad del tipo) |
| Cada tipo nuevo (en `D` y no en `C`): `total_spaces ≥ 1` | mensaje de rango en el campo |

Si todo pasa, se escribe en este orden y se detiene ante el primer error:

```ts
// 1. Tipos existentes que se conservan
await supabase.from('parking_vehicle_configs')
  .update({ hourly_rate, total_spaces })
  .eq('id', config.id)
  .select('id');                       // [] ⇒ tratar como permiso_denegado
// 2. Tipos que se quitan
await supabase.from('parking_vehicle_configs')
  .delete()
  .eq('id', config.id)
  .select('id');                       // [] ⇒ la RLS no lo permitió ⇒ MSG.parqueadero.quitarTipo
// 3. Tipos nuevos
await supabase.from('parking_vehicle_configs')
  .insert({ parking_lot_id, vehicle_type, hourly_rate, total_spaces });
// 4. Datos generales
await supabase.from('parking_lots')
  .update({ name, status, address, latitude, longitude, phone, contact_email, opening_hours })
  .eq('id', lot.id)
  .select('id');
```

- Si falla el paso 1 y no se escribió nada: mensaje del error y sin recarga.
- Si falla un paso posterior: `MSG.parqueadero.guardadoParcial` y `recargar()` + `reset(toFormValues(fresh))`.
- Éxito: `recargar()` y `/admin` con `flash = MSG.parqueadero.actualizado`.

## 5. Configurar celdas (HU6)

1. Leer de nuevo (§2) y validar en el cliente: `nueva ≥ occupied_spaces` por tipo (si no, `MSG.celdas.reducir`).
2. Para cada tipo cuyo valor cambió:
   `supabase.from('parking_vehicle_configs').update({ total_spaces }).eq('id', config.id).select('id')`.
3. Un error `23514` en `parking_vehicle_configs_check` (concurrencia) → `MSG.celdas.reducir` + `recargar()`.

## 6. Ocupación (HU7): RPC existentes

```ts
const { data: occupied, error } = await supabase.rpc('register_vehicle_entry', { p_vehicle_config_id: config.id });
// o 'register_vehicle_exit'. data = nuevo occupied_spaces (integer)
```

- Éxito: `actualizarConfig({ ...config, occupied_spaces: occupied })`.
- Antes de llamar, el front deshabilita el botón si no hay disponibles u ocupadas (HU7).

## 7. Mapeo de errores (`src/services/parkingErrors.ts`)

| Señal del back | Código del front | Mensaje |
|----------------|------------------|---------|
| `code = '23505'` | `YA_EXISTE` | Ya tienes un parqueadero registrado. |
| `code = '23514'` y `message` incluye `parking_vehicle_configs_check` | `CAPACIDAD_MENOR_A_OCUPADAS` | No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas |
| `code = '23514'` (otro CHECK), `22P02`, `22003` | `DATOS_INVALIDOS` | Revisa los datos ingresados. |
| `code = '42501'` | `PERMISO_DENEGADO` | No tienes permisos para realizar esta acción. Contacta al administrador del sistema. |
| `update`/`delete` con `.select()` que devuelve `[]` | `SIN_EFECTO` | (según el contexto: `quitarTipo` en delete; `permisoDenegado` en update) |
| RPC: `message` incluye `sin capacidad disponible` | `SIN_DISPONIBLES` | No hay celdas disponibles de este tipo |
| RPC: `message` incluye `sin celdas ocupadas` | `SIN_OCUPADAS` | No hay celdas ocupadas de este tipo para liberar |
| RPC: `message` incluye `Se requiere una sesión autenticada con MFA`; HTTP 401; `PGRST301` | `SESION` | (sin mensaje) → `handleSessionError` (001) |
| sin respuesta o desconocido | `RED` | No fue posible conectar con el servidor. Intenta nuevamente. |

## 8. Servicio (`src/services/adminParking.ts`)

Todas las funciones devuelven `Result<T, ParkingErrorCode>` (`src/lib/result.ts`) y nunca lanzan.

```ts
export type ConfigInput = { vehicle_type: VehicleType; hourly_rate: number; total_spaces: number };
export type ParkingInput = {
  name: string; address: string; latitude: number; longitude: number; phone: string;
  contact_email: string | null; opening_hours: string; configs: ConfigInput[];
};

export function getMyParkingLot(): Promise<Result<ParkingLot | null>>;
export function registerParkingLot(userId: string, input: ParkingInput): Promise<Result<{ id: string }>>; // §3
export function updateParkingLot(input: ParkingInput & { status: boolean }): Promise<Result<void>>;      // §4
export function configureSpaces(changes: { config_id: string; total_spaces: number }[]): Promise<Result<void>>; // §5
export function registerEntry(configId: string): Promise<Result<number>>;                              // §6
export function registerExit(configId: string): Promise<Result<number>>;                               // §6
```
