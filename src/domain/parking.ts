import type { Tables } from '../lib/database.types';

export type VehicleType = 'CAR' | 'MOTORCYCLE';
export const VEHICLE_TYPES: readonly VehicleType[] = ['CAR', 'MOTORCYCLE'];
export const VEHICLE_LABEL = {
  CAR: { singular: 'Automóvil', plural: 'Automóviles' },
  MOTORCYCLE: { singular: 'Motocicleta', plural: 'Motocicletas' },
} as const;

export type VehicleConfig = Omit<Tables<'parking_vehicle_configs'>, 'vehicle_type'> & {
  vehicle_type: VehicleType;
};
/** `status`: true = Activo, false = Inactivo. */
export type ParkingLot = Tables<'parking_lots'> & { parking_vehicle_configs: VehicleConfig[] };

export type ConfigInput = { vehicle_type: VehicleType; hourly_rate: number; total_spaces: number };
export type ParkingInput = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  contact_email: string | null;
  opening_hours: string;
  configs: ConfigInput[];
};

export const MEDELLIN_CENTER: [number, number] = [6.2442, -75.5812];
export const VALLE_ABURRA = { latMin: 6.0, latMax: 6.5, lngMin: -75.75, lngMax: -75.3 } as const;

export function availableSpaces(c: Pick<VehicleConfig, 'total_spaces' | 'occupied_spaces'>): number {
  return c.total_spaces - c.occupied_spaces;
}

export function totalCapacity(p: ParkingLot): number {
  return p.parking_vehicle_configs.reduce((sum, c) => sum + c.total_spaces, 0);
}

/** Lo mismo que aplica la vista pública: activo y con alguna celda configurada. */
export function isPublishable(p: ParkingLot): boolean {
  return p.status && totalCapacity(p) > 0;
}

/** Prioridad: inactivo > sin tipos > sin celdas. */
export function unpublishedReason(p: ParkingLot): 'inactivo' | 'sin_tipos' | 'sin_celdas' | null {
  if (!p.status) return 'inactivo';
  if (p.parking_vehicle_configs.length === 0) return 'sin_tipos';
  if (totalCapacity(p) === 0) return 'sin_celdas';
  return null;
}

export function isOutsideMedellin(lat: number, lng: number): boolean {
  return (
    lat < VALLE_ABURRA.latMin ||
    lat > VALLE_ABURRA.latMax ||
    lng < VALLE_ABURRA.lngMin ||
    lng > VALLE_ABURRA.lngMax
  );
}

/** Un tipo se puede quitar si no existe aún o si no tiene celdas ni ocupadas. */
export function canRemoveType(saved: VehicleConfig | undefined): boolean {
  return !saved || (saved.total_spaces === 0 && saved.occupied_spaces === 0);
}

export function isCapacityValid(next: number, occupied: number): boolean {
  return next >= occupied;
}

export function configOf(p: ParkingLot, t: VehicleType): VehicleConfig | undefined {
  return p.parking_vehicle_configs.find((c) => c.vehicle_type === t);
}

/** `CAR` primero. */
export function sortConfigs(cs: VehicleConfig[]): VehicleConfig[] {
  return [...cs].sort((a, b) => VEHICLE_TYPES.indexOf(a.vehicle_type) - VEHICLE_TYPES.indexOf(b.vehicle_type));
}

export type EditValidation =
  | null
  | { code: 'SIN_TIPOS' }
  | { code: 'TIPO_CON_CELDAS'; type: VehicleType }
  | { code: 'CAPACIDAD_MENOR_A_OCUPADAS'; type: VehicleType }
  | { code: 'CAPACIDAD_NUEVO_TIPO'; type: VehicleType };

/** HU5: devuelve el primer error de negocio (en el orden de `back-usage.md` §4) o null. */
export function validateEdit(current: VehicleConfig[], desired: ConfigInput[]): EditValidation {
  if (desired.length === 0) return { code: 'SIN_TIPOS' };

  for (const c of current) {
    const stays = desired.some((d) => d.vehicle_type === c.vehicle_type);
    if (!stays && !canRemoveType(c)) return { code: 'TIPO_CON_CELDAS', type: c.vehicle_type };
  }

  for (const d of desired) {
    const saved = current.find((c) => c.vehicle_type === d.vehicle_type);
    if (saved && !isCapacityValid(d.total_spaces, saved.occupied_spaces)) {
      return { code: 'CAPACIDAD_MENOR_A_OCUPADAS', type: d.vehicle_type };
    }
  }

  for (const d of desired) {
    const isNew = !current.some((c) => c.vehicle_type === d.vehicle_type);
    if (isNew && d.total_spaces < 1) return { code: 'CAPACIDAD_NUEVO_TIPO', type: d.vehicle_type };
  }

  return null;
}

/** HU5: plan de escritura (qué actualizar, borrar o insertar). */
export function diffConfigs(
  current: VehicleConfig[],
  desired: ConfigInput[],
): {
  toUpdate: { id: string; hourly_rate: number; total_spaces: number }[];
  toDelete: { id: string; vehicle_type: VehicleType }[];
  toInsert: ConfigInput[];
} {
  const toUpdate: { id: string; hourly_rate: number; total_spaces: number }[] = [];
  const toDelete: { id: string; vehicle_type: VehicleType }[] = [];

  for (const c of current) {
    const d = desired.find((x) => x.vehicle_type === c.vehicle_type);
    if (d) toUpdate.push({ id: c.id, hourly_rate: d.hourly_rate, total_spaces: d.total_spaces });
    else toDelete.push({ id: c.id, vehicle_type: c.vehicle_type });
  }

  const toInsert = desired.filter((d) => !current.some((c) => c.vehicle_type === d.vehicle_type));
  return { toUpdate, toDelete, toInsert };
}
