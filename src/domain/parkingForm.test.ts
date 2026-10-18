import { describe, expect, it } from 'vitest';
import { emptyParkingForm, toFormValues, toParkingInput } from './parkingForm';
import type { ParkingLot, VehicleConfig } from './parking';

const config = (type: 'CAR' | 'MOTORCYCLE', rate: number, total: number): VehicleConfig => ({
  id: type,
  parking_lot_id: 'lot',
  vehicle_type: type,
  hourly_rate: rate,
  total_spaces: total,
  occupied_spaces: 0,
  created_at: '',
  updated_at: '',
});

const lot = (overrides: Partial<ParkingLot> = {}): ParkingLot => ({
  id: 'lot',
  admin_id: 'u1',
  name: 'Parqueadero Centro',
  status: true,
  address: 'Calle 50 # 45-10',
  latitude: 6.2442,
  longitude: -75.5812,
  phone: '3001234567',
  contact_email: 'contacto@dominio.com',
  opening_hours: '24 horas',
  created_at: '',
  updated_at: '',
  parking_vehicle_configs: [config('CAR', 5000, 20), config('MOTORCYCLE', 2000, 10)],
  ...overrides,
});

describe('toFormValues', () => {
  it('mapea el parqueadero con sus dos tipos', () => {
    expect(toFormValues(lot())).toEqual({
      name: 'Parqueadero Centro',
      address: 'Calle 50 # 45-10',
      latitude: '6.2442',
      longitude: '-75.5812',
      phone: '3001234567',
      contactEmail: 'contacto@dominio.com',
      openingHours: '24 horas',
      servesCars: true,
      carRate: '5000',
      carSpaces: '20',
      servesMotorcycles: true,
      motorcycleRate: '2000',
      motorcycleSpaces: '10',
      status: 'activo',
    });
  });

  it('sin correo ni motos; status false → inactivo', () => {
    const v = toFormValues(lot({ contact_email: null, status: false, parking_vehicle_configs: [config('CAR', 5000, 1)] }));
    expect(v.contactEmail).toBe('');
    expect(v.servesMotorcycles).toBe(false);
    expect(v.motorcycleRate).toBe('');
    expect(v.status).toBe('inactivo');
  });
});

describe('toParkingInput', () => {
  it('arma 2 configs, convierte a número y recorta', () => {
    const input = toParkingInput({
      ...toFormValues(lot()),
      name: '  Centro  ',
      latitude: '6,2442',
      contactEmail: '  contacto@dominio.com ',
    });
    expect(input.name).toBe('Centro');
    expect(input.latitude).toBe(6.2442);
    expect(input.contact_email).toBe('contacto@dominio.com');
    expect(input.configs).toEqual([
      { vehicle_type: 'CAR', hourly_rate: 5000, total_spaces: 20 },
      { vehicle_type: 'MOTORCYCLE', hourly_rate: 2000, total_spaces: 10 },
    ]);
  });

  it('arma 1 config y devuelve null si el correo está vacío', () => {
    const input = toParkingInput({ ...emptyParkingForm, servesMotorcycles: true, motorcycleRate: '2000', motorcycleSpaces: '3', latitude: '1', longitude: '2' });
    expect(input.contact_email).toBeNull();
    expect(input.configs).toEqual([{ vehicle_type: 'MOTORCYCLE', hourly_rate: 2000, total_spaces: 3 }]);
  });

  it('toFormValues es inversa de toParkingInput', () => {
    const original = lot();
    const input = toParkingInput(toFormValues(original));
    expect(input).toMatchObject({
      name: original.name,
      address: original.address,
      latitude: original.latitude,
      longitude: original.longitude,
      phone: original.phone,
      contact_email: original.contact_email,
      opening_hours: original.opening_hours,
    });
    expect(input.configs).toHaveLength(2);
  });
});
