# Data Model: Gestión del Parqueadero (002)

Fuente: back existente (**sin cambios**), documentado en `docs/supabase-esquema-actual.md`. El acceso desde
el front está en [contracts/back-usage.md](./contracts/back-usage.md).

## Diagrama

```text
auth.users 1 ──── 0..1 public.parking_lots 1 ──── 0..2 public.parking_vehicle_configs
                  (admin_id UNIQUE)                (UNIQUE parking_lot_id + vehicle_type)
```

## `public.parking_lots` (back)

| Columna | Tipo | Regla en el back | Regla adicional en el front (HU3) | Campo de UI |
|---------|------|------------------|-----------------------------------|-------------|
| `id` | uuid | PK | — | — |
| `admin_id` | uuid | UNIQUE, FK `auth.users`, RLS = `auth.uid()` | lo envía el front (`user.id`) | — |
| `name` | text | `trim` no vacío | 3–100 caracteres | Nombre del parqueadero |
| `status` | boolean | default `true` | `true` = Activo | Estado del parqueadero |
| `address` | text | `trim` no vacío | 5–200 | Dirección |
| `latitude` | float8 | −90..90 | ≤ 6 decimales; aviso fuera del Valle de Aburrá | Latitud |
| `longitude` | float8 | −180..180 | ≤ 6 decimales | Longitud |
| `phone` | text | `trim` no vacío | solo dígitos, 7–10 | Teléfono de contacto |
| `contact_email` | text, null | formato email | opcional | Correo electrónico de contacto |
| `opening_hours` | text | `trim` no vacío | 3–120 | Horario de atención |
| `created_at` / `updated_at` | timestamptz | trigger `set_updated_at` | — | — |

## `public.parking_vehicle_configs` (back)

| Columna | Tipo | Regla en el back | Regla adicional en el front | Campo de UI |
|---------|------|------------------|-----------------------------|-------------|
| `id` | uuid | PK | — | — |
| `parking_lot_id` | uuid | FK | — | — |
| `vehicle_type` | text | `'CAR'` \| `'MOTORCYCLE'`; único por parqueadero | — | Tipos de vehículo atendidos |
| `hourly_rate` | integer | > 0 | 1–999.999 (COP) | Tarifa por hora (<Tipo>) |
| `total_spaces` | integer | ≥ 0; **> 0 al crear** (política insert) | 1–9.999 al crear; 0–9.999 al editar; ≥ ocupadas | Capacidad de celdas (<Tipo>) |
| `occupied_spaces` | integer | `0 ≤ occupied ≤ total` | solo cambia vía las RPC de HU7 | Celdas ocupadas |
| `created_at` / `updated_at` | timestamptz | trigger | — | — |

**Derivado**: `disponibles = total_spaces − occupied_spaces`.

## Reglas de negocio y dónde se garantizan

| Regla (HU) | Back | Front |
|------------|------|-------|
| 1 parqueadero por admin (HU3) | ✅ `UNIQUE(admin_id)` | `RequireNoParking`; `23505` → `yaExiste` |
| Solo el dueño con aal2 lee o escribe (HU3–HU7) | ✅ RLS + RPC | guards de la 001 |
| `0 ≤ ocupadas ≤ capacidad` (HU6, HU7) | ✅ `CHECK` + RPC atómicas | botones deshabilitados; validación previa de capacidad |
| Quitar un tipo solo con capacidad 0 (HU5) | ✅ política delete | `canRemoveType` en el checkbox + `validateEdit` |
| Crear un tipo con capacidad ≥ 1 (HU6) | ✅ política insert | esquema Zod |
| Tarifa > 0 (HU3) | ✅ `CHECK` | 1–999.999 |
| Al menos 1 tipo atendido (HU5) | ❌ | `validateEdit` + esquema |
| Teléfono solo dígitos; longitudes de texto (HU3) | ❌ | esquema Zod |

## Publicabilidad (la aplica la vista `public_parking_lots`; se refleja en el panel)

```text
publicable(p) = p.status = true AND algún tipo con total_spaces > 0
```

| `status` | Tipos | Σ capacidad | Aviso en el panel |
|----------|-------|-------------|-------------------|
| true | ≥ 1 | > 0 | — |
| true | ≥ 1 | 0 | Tu parqueadero no aparece en el mapa público porque no tiene celdas configuradas. |
| true | 0 | — | Tu parqueadero no tiene tipos de vehículo configurados. |
| false | cualquiera | cualquiera | Tu parqueadero está inactivo y no aparece en el mapa público. |

## Esquema del formulario (`makeParkingFormSchema`)

Todos los valores son string o boolean; se aplica `trim`, y `normalizeDecimal` a las coordenadas.

| Campo | Regla | Mensaje |
|-------|-------|---------|
| `name` | requerido; 3–100 | `campoObligatorio` · `longitud(3,100)` |
| `address` | requerido; 5–200 | `longitud(5,200)` |
| `latitude` | requerido; número −90..90; ≤ 6 decimales | `latitudRango` |
| `longitude` | requerido; número −180..180; ≤ 6 decimales | `longitudRango` |
| `phone` | requerido; `^\d+$`; 7–10 | `telefonoNumerico` · `telefonoLongitud` |
| `contactEmail` | opcional; formato email | `correoFormato` |
| `openingHours` | requerido; 3–120 | `longitud(3,120)` |
| `servesCars` / `servesMotorcycles` | al menos uno | resumen `requeridos` + grupo en rojo |
| `carRate` / `motorcycleRate` | requerido si el tipo está marcado; entero 1–999999 | `tarifaRango` |
| `carSpaces` / `motorcycleSpaces` | requerido si está marcado; entero; mínimo 1 (registro o tipo nuevo) o 0 (tipo guardado en la edición); máximo 9999 | `capacidadNueva` · `enteroNoNegativo` |
| `status` (solo edición) | `'activo' \| 'inactivo'` → `status: boolean` | — |

Aviso no bloqueante (fuera del esquema): `isOutsideMedellin(lat, lng)` → `fueraDeMedellin`.
