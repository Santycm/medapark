import type { Tables } from '../lib/database.types';
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
  /** CAR primero; solo los tipos atendidos. */
  offers: PublicOffer[];
};

type Row = Tables<'public_parking_lots'>;

const LABELS: Record<VehicleType, string> = { CAR: 'Automóviles', MOTORCYCLE: 'Motocicletas' };

export function hasValidCoordinates(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/**
 * Fila plana de la vista → dominio. Un tipo es atendido si su `*_total_spaces` no es null.
 * Descarta las filas sin id o sin coordenadas válidas.
 */
export function toPublicParking(row: Row): PublicParking | null {
  if (!row.id || !hasValidCoordinates(row.latitude, row.longitude)) return null;

  const offers: PublicOffer[] = [];
  if (row.car_total_spaces !== null) {
    offers.push({
      vehicle_type: 'CAR',
      hourly_rate: row.car_hourly_rate ?? 0,
      total_spaces: row.car_total_spaces,
      available_spaces: row.car_available_spaces ?? 0,
    });
  }
  if (row.motorcycle_total_spaces !== null) {
    offers.push({
      vehicle_type: 'MOTORCYCLE',
      hourly_rate: row.motorcycle_hourly_rate ?? 0,
      total_spaces: row.motorcycle_total_spaces,
      available_spaces: row.motorcycle_available_spaces ?? 0,
    });
  }

  return {
    id: row.id,
    name: row.name ?? '',
    address: row.address ?? '',
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    phone: row.phone ?? '',
    contact_email: row.contact_email,
    opening_hours: row.opening_hours ?? '',
    offers,
  };
}

/** Destino en Google Maps (punto decimal, máximo 6 decimales). Reemplaza `maps/search`. */
export function googleMapsUrl(lat: number, lng: number): string {
  const fixed = (n: number) => Number(n.toFixed(6));
  return `https://www.google.com/maps/dir/?api=1&destination=${fixed(lat)},${fixed(lng)}`;
}

/** Lleno: hay ofertas y todas con 0 celdas disponibles. */
export function isFull(p: PublicParking): boolean {
  return p.offers.length > 0 && p.offers.every((o) => o.available_spaces === 0);
}

/** `"Automóviles 12/20 · Motocicletas 8/15"`. */
export function availabilitySummary(p: PublicParking): string {
  return p.offers
    .map((o) => `${LABELS[o.vehicle_type]} ${o.available_spaces}/${o.total_spaces}`)
    .join(' · ');
}

export function sortByName(ps: PublicParking[]): PublicParking[] {
  return [...ps].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
