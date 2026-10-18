# Contrato: datos públicos desde la vista existente (003)

Esta feature **no requiere cambios en el back**. La vista `public.public_parking_lots` (`docs/supabase-esquema-actual.md` §1) ya:

- incluye solo los parqueaderos con `status = true` y al menos un tipo con `total_spaces > 0`
  (regla de publicabilidad);
- expone solo columnas públicas (sin `admin_id`);
- calcula `*_available_spaces`;
- es legible por `anon` y `authenticated`.

## 1. Consulta (`src/services/parkings.ts`, existente y migrado en la 001)

```ts
// Se conserva la firma existente y se agrega el mapeo al dominio
export async function getPublicParkings(): Promise<Tables<'public_parking_lots'>[]> {
  const { data, error } = await supabase.from('public_parking_lots').select('*').order('name');
  if (error) throw error;
  return data;
}

// NUEVA (usada por la página rediseñada): no lanza
export function listPublicParkings(): Promise<Result<PublicParking[], 'RED'>>;
```

`getPublicParkingById` (existente) deja de usarse en el MVP: el detalle sale de la lista ya cargada. Se
conserva sin cambios.

## 2. Fila de la vista (generada en `database.types.ts`)

| Columna | Tipo | Notas |
|---------|------|-------|
| `id`, `name`, `address`, `phone`, `opening_hours` | string \| null | `null` solo por la tipificación de las vistas |
| `latitude`, `longitude` | number \| null | |
| `contact_email` | string \| null | opcional |
| `car_hourly_rate`, `car_total_spaces`, `car_occupied_spaces`, `car_available_spaces` | number \| null | **todos `null`** si el parqueadero no atiende automóviles |
| `motorcycle_hourly_rate`, `motorcycle_total_spaces`, `motorcycle_occupied_spaces`, `motorcycle_available_spaces` | number \| null | ídem para motocicletas |

## 3. Dominio público (`src/domain/publicParking.ts`)

```ts
import type { VehicleType } from './parking';

export type PublicOffer = {
  vehicle_type: VehicleType;
  hourly_rate: number;
  total_spaces: number;
  available_spaces: number;
};

export type PublicParking = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  contact_email: string | null;
  opening_hours: string;
  offers: PublicOffer[];          // CAR primero; solo los tipos atendidos
};

/** Fila plana → dominio. Un tipo es atendido si su `*_total_spaces` no es null. Descarta las filas sin id o sin coordenadas. */
export function toPublicParking(row: Tables<'public_parking_lots'>): PublicParking | null;

export function googleMapsUrl(lat: number, lng: number): string;
//   `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` (punto decimal, máx. 6 decimales)
//   Reemplaza la URL actual del repo (`maps/search/?api=1&query=`), porque HU11 pide una ruta.
export function hasValidCoordinates(lat: unknown, lng: unknown): boolean;
export function isFull(p: PublicParking): boolean;                 // todas las ofertas con available_spaces === 0
export function availabilitySummary(p: PublicParking): string;      // "Automóviles 12/20 · Motocicletas 8/15"
export function sortByName(ps: PublicParking[]): PublicParking[];   // localeCompare('es')
```

## 4. Ejemplo de mapeo

```json
{ "id": "3f0c…", "name": "Parqueadero Centro", "address": "Calle 50 # 45-10, Medellín",
  "latitude": 6.2442, "longitude": -75.5812, "phone": "3001234567", "contact_email": null,
  "opening_hours": "Lunes a Domingo, 6:00 a.m. - 10:00 p.m.",
  "car_hourly_rate": 5000, "car_total_spaces": 20, "car_occupied_spaces": 8, "car_available_spaces": 12,
  "motorcycle_hourly_rate": null, "motorcycle_total_spaces": null, "motorcycle_occupied_spaces": null,
  "motorcycle_available_spaces": null }
```

↓ `toPublicParking`

```json
{ "id": "3f0c…", "name": "Parqueadero Centro", "...": "...",
  "offers": [ { "vehicle_type": "CAR", "hourly_rate": 5000, "total_spaces": 20, "available_spaces": 12 } ] }
```
