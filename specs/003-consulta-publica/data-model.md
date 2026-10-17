# Data Model: Consulta Pública (003)

Esta feature **no crea ni modifica nada en el back**. Lee la vista existente `public.public_parking_lots`
(`docs/supabase-esquema-actual.md` §1) y la mapea al dominio `PublicParking`
([contracts/public-view.md](./contracts/public-view.md)).

## Vista lógica `PublicParking`

| Campo | Origen (vista) | Notas |
|-------|----------------|-------|
| `id` | `id` | Se usa en `?parqueadero=` |
| `name`, `address`, `phone`, `opening_hours` | mismas columnas | |
| `contact_email` | `contact_email` | puede ser `null` |
| `latitude`, `longitude` | mismas columnas | posición del marcador y destino de Google Maps |
| `offers[]` | `car_*` y `motorcycle_*` | una oferta por tipo cuyo `*_total_spaces` no es `null` |
| `offers[].vehicle_type` | `'CAR'` \| `'MOTORCYCLE'` | |
| `offers[].hourly_rate` | `*_hourly_rate` | COP enteros |
| `offers[].total_spaces` | `*_total_spaces` | puede ser 0 si el otro tipo tiene capacidad |
| `offers[].available_spaces` | `*_available_spaces` | calculado por la vista |

**Excluidos por la vista**: `admin_id`, `status` (siempre activo), `created_at` y `updated_at`.
`*_occupied_spaces` existe en la vista pero el front no lo muestra (HU10 pide disponibles y capacidad).

## Regla de inclusión (la aplica la vista)

```text
incluido(p) ⇔ p.status = true ∧ (car.total_spaces > 0 ∨ moto.total_spaces > 0)
```

## Estados derivados en la UI

| Estado | Condición | Marcador | Lista |
|--------|-----------|----------|-------|
| Con disponibilidad | ∃ oferta con `available_spaces > 0` | verde | normal |
| Lleno | ∀ ofertas `available_spaces = 0` | gris | badge "Sin celdas disponibles" |
| Seleccionado | `id === ?parqueadero` | azul, más grande, con tooltip | fondo resaltado |

## Estado de la página

```ts
type LoadState = 'cargando' | 'error' | 'listo';
// selección: URLSearchParams 'parqueadero' (string | null)
```
