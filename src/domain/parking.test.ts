import { describe, expect, it } from 'vitest';
import {
  availableSpaces,
  canRemoveType,
  configOf,
  diffConfigs,
  isCapacityValid,
  isOutsideMedellin,
  isPublishable,
  sortConfigs,
  totalCapacity,
  unpublishedReason,
  validateEdit,
  type ParkingLot,
  type VehicleConfig,
  type VehicleType,
} from './parking';

const config = (type: VehicleType, total: number, occupied = 0, id: string = type): VehicleConfig => ({
  id,
  parking_lot_id: 'lot',
  vehicle_type: type,
  hourly_rate: 5000,
  total_spaces: total,
  occupied_spaces: occupied,
  created_at: '',
  updated_at: '',
});

const lot = (status: boolean, configs: VehicleConfig[]): ParkingLot => ({
  id: 'lot',
  admin_id: 'u1',
  name: 'Centro',
  status,
  address: 'Calle 50',
  latitude: 6.2442,
  longitude: -75.5812,
  phone: '3001234567',
  contact_email: null,
  opening_hours: '24 horas',
  created_at: '',
  updated_at: '',
  parking_vehicle_configs: configs,
});

describe('availableSpaces y totalCapacity', () => {
  it('calcula disponibles y capacidad total', () => {
    expect(availableSpaces(config('CAR', 20, 5))).toBe(15);
    expect(totalCapacity(lot(true, [config('CAR', 20), config('MOTORCYCLE', 10)]))).toBe(30);
    expect(totalCapacity(lot(true, []))).toBe(0);
  });
});

describe('publicabilidad', () => {
  it.each([
    [true, [config('CAR', 5)], true, null],
    [true, [config('CAR', 0), config('MOTORCYCLE', 0)], false, 'sin_celdas'],
    [true, [], false, 'sin_tipos'],
    [false, [config('CAR', 5)], false, 'inactivo'],
    [false, [], false, 'inactivo'],
    [false, [config('CAR', 0)], false, 'inactivo'],
  ] as const)('status=%s configs=%j → publicable=%s, motivo=%s', (status, configs, publishable, reason) => {
    const p = lot(status, [...configs]);
    expect(isPublishable(p)).toBe(publishable);
    expect(unpublishedReason(p)).toBe(reason);
  });
});

describe('isOutsideMedellin', () => {
  it('Parque Berrío dentro, Bogotá fuera, bordes dentro', () => {
    expect(isOutsideMedellin(6.2518, -75.568)).toBe(false);
    expect(isOutsideMedellin(4.711, -74.0721)).toBe(true);
    expect(isOutsideMedellin(6.0, -75.75)).toBe(false);
    expect(isOutsideMedellin(6.5, -75.3)).toBe(false);
    expect(isOutsideMedellin(6.51, -75.5)).toBe(true);
    expect(isOutsideMedellin(6.2, -75.29)).toBe(true);
  });
});

describe('canRemoveType e isCapacityValid', () => {
  it('permite quitar un tipo inexistente o vacío', () => {
    expect(canRemoveType(undefined)).toBe(true);
    expect(canRemoveType(config('CAR', 0, 0))).toBe(true);
    expect(canRemoveType(config('CAR', 5, 0))).toBe(false);
    expect(canRemoveType(config('CAR', 0, 1))).toBe(false);
  });

  it('la capacidad no puede ser menor a las ocupadas', () => {
    expect(isCapacityValid(5, 5)).toBe(true);
    expect(isCapacityValid(4, 5)).toBe(false);
  });
});

describe('configOf y sortConfigs', () => {
  it('busca por tipo y ordena con CAR primero', () => {
    const p = lot(true, [config('MOTORCYCLE', 3), config('CAR', 4)]);
    expect(configOf(p, 'CAR')?.total_spaces).toBe(4);
    expect(configOf(lot(true, []), 'CAR')).toBeUndefined();
    expect(sortConfigs(p.parking_vehicle_configs).map((c) => c.vehicle_type)).toEqual(['CAR', 'MOTORCYCLE']);
  });
});

describe('validateEdit', () => {
  const car = (total: number, rate = 5000) => ({ vehicle_type: 'CAR' as const, hourly_rate: rate, total_spaces: total });
  const moto = (total: number) => ({ vehicle_type: 'MOTORCYCLE' as const, hourly_rate: 2000, total_spaces: total });

  it('sin tipos deseados → SIN_TIPOS', () => {
    expect(validateEdit([config('CAR', 5)], [])).toEqual({ code: 'SIN_TIPOS' });
  });

  it('quitar un tipo con capacidad u ocupadas → TIPO_CON_CELDAS', () => {
    expect(validateEdit([config('CAR', 5), config('MOTORCYCLE', 3)], [car(5)])).toEqual({
      code: 'TIPO_CON_CELDAS',
      type: 'MOTORCYCLE',
    });
  });

  it('quitar un tipo vacío es válido', () => {
    expect(validateEdit([config('CAR', 5), config('MOTORCYCLE', 0)], [car(5)])).toBeNull();
  });

  it('capacidad menor a las ocupadas → CAPACIDAD_MENOR_A_OCUPADAS', () => {
    expect(validateEdit([config('CAR', 10, 6)], [car(5)])).toEqual({
      code: 'CAPACIDAD_MENOR_A_OCUPADAS',
      type: 'CAR',
    });
  });

  it('tipo nuevo con 0 → CAPACIDAD_NUEVO_TIPO; con 1 es válido', () => {
    expect(validateEdit([config('CAR', 5)], [car(5), moto(0)])).toEqual({
      code: 'CAPACIDAD_NUEVO_TIPO',
      type: 'MOTORCYCLE',
    });
    expect(validateEdit([config('CAR', 5)], [car(5), moto(1)])).toBeNull();
  });

  it('un tipo guardado admite capacidad 0 si no hay ocupadas', () => {
    expect(validateEdit([config('CAR', 5, 0)], [car(0)])).toBeNull();
  });

  it('respeta la prioridad de las reglas', () => {
    const current = [config('CAR', 10, 6), config('MOTORCYCLE', 3)];
    expect(validateEdit(current, [car(5)])?.code).toBe('TIPO_CON_CELDAS');
  });
});

describe('diffConfigs', () => {
  it('actualiza, borra e inserta según corresponda', () => {
    const current = [config('CAR', 5, 0, 'c1'), config('MOTORCYCLE', 0, 0, 'm1')];
    const plan = diffConfigs(current, [{ vehicle_type: 'CAR', hourly_rate: 6000, total_spaces: 8 }]);
    expect(plan.toUpdate).toEqual([{ id: 'c1', hourly_rate: 6000, total_spaces: 8 }]);
    expect(plan.toDelete).toEqual([{ id: 'm1', vehicle_type: 'MOTORCYCLE' }]);
    expect(plan.toInsert).toEqual([]);
  });

  it('inserta un tipo nuevo', () => {
    const plan = diffConfigs(
      [config('CAR', 5, 0, 'c1')],
      [
        { vehicle_type: 'CAR', hourly_rate: 5000, total_spaces: 5 },
        { vehicle_type: 'MOTORCYCLE', hourly_rate: 2000, total_spaces: 2 },
      ],
    );
    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toDelete).toEqual([]);
    expect(plan.toInsert).toEqual([{ vehicle_type: 'MOTORCYCLE', hourly_rate: 2000, total_spaces: 2 }]);
  });
});
