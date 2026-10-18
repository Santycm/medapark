import { describe, expect, it } from 'vitest';
import type { Tables } from '../lib/database.types';
import {
  availabilitySummary,
  googleMapsUrl,
  hasValidCoordinates,
  isFull,
  sortByName,
  toPublicParking,
  type PublicParking,
} from './publicParking';

type Row = Tables<'public_parking_lots'>;

const row = (overrides: Partial<Row> = {}): Row => ({
  id: 'p1',
  name: 'Parqueadero Centro',
  address: 'Calle 50 # 45-10, Medellín',
  latitude: 6.2442,
  longitude: -75.5812,
  phone: '3001234567',
  contact_email: null,
  opening_hours: '24 horas',
  car_hourly_rate: 5000,
  car_total_spaces: 20,
  car_occupied_spaces: 8,
  car_available_spaces: 12,
  motorcycle_hourly_rate: 2000,
  motorcycle_total_spaces: 15,
  motorcycle_occupied_spaces: 7,
  motorcycle_available_spaces: 8,
  ...overrides,
});

const noMotos = {
  motorcycle_hourly_rate: null,
  motorcycle_total_spaces: null,
  motorcycle_occupied_spaces: null,
  motorcycle_available_spaces: null,
};
const noCars = {
  car_hourly_rate: null,
  car_total_spaces: null,
  car_occupied_spaces: null,
  car_available_spaces: null,
};

const parking = (name: string, offers: PublicParking['offers'] = []): PublicParking => ({
  id: name,
  name,
  address: '',
  latitude: 6,
  longitude: -75,
  phone: '',
  contact_email: null,
  opening_hours: '',
  offers,
});

describe('toPublicParking', () => {
  it('con ambos tipos: CAR primero', () => {
    const p = toPublicParking(row());
    expect(p?.offers.map((o) => o.vehicle_type)).toEqual(['CAR', 'MOTORCYCLE']);
    expect(p?.offers[0]).toEqual({ vehicle_type: 'CAR', hourly_rate: 5000, total_spaces: 20, available_spaces: 12 });
  });

  it('solo autos o solo motos', () => {
    expect(toPublicParking(row(noMotos))?.offers).toHaveLength(1);
    expect(toPublicParking(row(noCars))?.offers.map((o) => o.vehicle_type)).toEqual(['MOTORCYCLE']);
  });

  it('un tipo con capacidad 0 se incluye', () => {
    const p = toPublicParking(row({ motorcycle_total_spaces: 0, motorcycle_available_spaces: 0 }));
    expect(p?.offers).toHaveLength(2);
    expect(p?.offers[1].total_spaces).toBe(0);
  });

  it('descarta las filas sin id o sin coordenadas válidas', () => {
    expect(toPublicParking(row({ id: null }))).toBeNull();
    expect(toPublicParking(row({ latitude: null }))).toBeNull();
    expect(toPublicParking(row({ longitude: null }))).toBeNull();
    expect(toPublicParking(row({ latitude: 91 }))).toBeNull();
  });

  it('conserva el correo cuando existe', () => {
    expect(toPublicParking(row({ contact_email: 'a@b.co' }))?.contact_email).toBe('a@b.co');
  });
});

describe('googleMapsUrl', () => {
  it('arma la ruta con punto decimal', () => {
    expect(googleMapsUrl(6.2518, -75.568)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=6.2518,-75.568',
    );
  });

  it('redondea a 6 decimales', () => {
    expect(googleMapsUrl(6.12345678, -75.98765432)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=6.123457,-75.987654',
    );
  });
});

describe('hasValidCoordinates', () => {
  it.each([
    [6.2, -75.5, true],
    [NaN, -75, false],
    [91, 0, false],
    [0, 181, false],
    ['6', -75, false],
    [null, null, false],
    [Infinity, 0, false],
  ])('(%s, %s) → %s', (lat, lng, expected) => {
    expect(hasValidCoordinates(lat, lng)).toBe(expected);
  });
});

describe('isFull', () => {
  const offer = (available: number) => ({ vehicle_type: 'CAR' as const, hourly_rate: 1, total_spaces: 5, available_spaces: available });

  it('lleno solo si todas las ofertas están en 0', () => {
    expect(isFull(parking('a', [offer(0), { ...offer(0), vehicle_type: 'MOTORCYCLE' }]))).toBe(true);
    expect(isFull(parking('a', [offer(0), { ...offer(2), vehicle_type: 'MOTORCYCLE' }]))).toBe(false);
    expect(isFull(parking('a', []))).toBe(false);
  });
});

describe('availabilitySummary', () => {
  it('con uno y con dos tipos', () => {
    const car = { vehicle_type: 'CAR' as const, hourly_rate: 1, total_spaces: 20, available_spaces: 12 };
    const moto = { vehicle_type: 'MOTORCYCLE' as const, hourly_rate: 1, total_spaces: 15, available_spaces: 8 };
    expect(availabilitySummary(parking('a', [car]))).toBe('Automóviles 12/20');
    expect(availabilitySummary(parking('a', [car, moto]))).toBe('Automóviles 12/20 · Motocicletas 8/15');
  });
});

describe('sortByName', () => {
  it('ordena alfabéticamente respetando tildes y sin mutar', () => {
    const input = [parking('Zona'), parking('Ángel'), parking('Belén'), parking('Centro')];
    expect(sortByName(input).map((p) => p.name)).toEqual(['Ángel', 'Belén', 'Centro', 'Zona']);
    expect(input[0].name).toBe('Zona');
  });
});
