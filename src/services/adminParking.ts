import { handleSessionError } from '../context/authContext';
import {
  diffConfigs,
  isCapacityValid,
  sortConfigs,
  validateEdit,
  type ParkingInput,
  type ParkingLot,
  type VehicleConfig,
  type VehicleType,
} from '../domain/parking';
import { supabase } from '../lib/supabase';
import {
  toParkingErrorCode,
  toParkingMessage,
  type ParkingErrorCode,
} from './parkingErrors';

/** Como `Result`, con el tipo de vehículo cuando el error apunta a un campo concreto. */
export type ParkingResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ParkingErrorCode; message: string; vehicleType?: VehicleType };

const success = <T>(data: T): ParkingResult<T> => ({ ok: true, data });

const failure = (code: ParkingErrorCode, vehicleType?: VehicleType): ParkingResult<never> => ({
  ok: false,
  code,
  message: toParkingMessage(code),
  ...(vehicleType ? { vehicleType } : {}),
});

/** Traduce un error del back y, si es de sesión, cierra la sesión local (001). */
async function fromBackendError(error: unknown, vehicleType?: VehicleType): Promise<ParkingResult<never>> {
  const code = toParkingErrorCode(error);
  if (code === 'SESION') await handleSessionError({ status: 401 });
  return failure(code, vehicleType);
}

/** HU4: parqueadero propio con sus configuraciones (la RLS limita a dueño + aal2). */
export async function getMyParkingLot(): Promise<ParkingResult<ParkingLot | null>> {
  const { data, error } = await supabase
    .from('parking_lots')
    .select('*, parking_vehicle_configs(*)')
    .maybeSingle();

  if (error) return fromBackendError(error);
  if (!data) return success(null);

  const lot = data as unknown as ParkingLot;
  return success({ ...lot, parking_vehicle_configs: sortConfigs(lot.parking_vehicle_configs ?? []) });
}

/** HU3: registro en 2 pasos (parqueadero y luego sus tipos de vehículo). */
export async function registerParkingLot(
  userId: string,
  input: ParkingInput,
): Promise<ParkingResult<{ id: string }>> {
  const { data: lot, error: lotError } = await supabase
    .from('parking_lots')
    .insert({
      admin_id: userId,
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone,
      contact_email: input.contact_email || null,
      opening_hours: input.opening_hours,
      status: true,
    })
    .select('id')
    .single();

  if (lotError || !lot) return fromBackendError(lotError);

  const { error: configsError } = await supabase.from('parking_vehicle_configs').insert(
    input.configs.map((c) => ({
      parking_lot_id: lot.id,
      vehicle_type: c.vehicle_type,
      hourly_rate: c.hourly_rate,
      total_spaces: c.total_spaces,
    })),
  );

  if (configsError) return failure('REGISTRO_INCOMPLETO');
  return success({ id: lot.id });
}

/**
 * HU5: valida contra el estado actual y escribe en orden
 * (actualizar → borrar → insertar → datos generales). No es atómico por diseño.
 */
export async function updateParkingLot(
  input: ParkingInput & { status: boolean },
): Promise<ParkingResult<void>> {
  const current = await getMyParkingLot();
  if (!current.ok) return current;
  if (!current.data) return failure('DATOS_INVALIDOS');
  const lot = current.data;

  const invalid = validateEdit(lot.parking_vehicle_configs, input.configs);
  if (invalid) {
    return failure(invalid.code, 'type' in invalid ? invalid.type : undefined);
  }

  const plan = diffConfigs(lot.parking_vehicle_configs, input.configs);
  let written = false;

  /** Tras la primera escritura, cualquier fallo es un guardado parcial. */
  const fail = async (error: unknown, fallback?: ParkingErrorCode, type?: VehicleType) => {
    if (written) return failure('GUARDADO_PARCIAL');
    return fallback ? failure(fallback, type) : fromBackendError(error, type);
  };

  for (const c of plan.toUpdate) {
    const { data, error } = await supabase
      .from('parking_vehicle_configs')
      .update({ hourly_rate: c.hourly_rate, total_spaces: c.total_spaces })
      .eq('id', c.id)
      .select('id');
    if (error) return fail(error);
    if (!data || data.length === 0) return fail(null, 'PERMISO_DENEGADO');
    written = true;
  }

  for (const c of plan.toDelete) {
    const { data, error } = await supabase
      .from('parking_vehicle_configs')
      .delete()
      .eq('id', c.id)
      .select('id');
    if (error) return fail(error);
    if (!data || data.length === 0) return fail(null, 'TIPO_CON_CELDAS', c.vehicle_type);
    written = true;
  }

  for (const c of plan.toInsert) {
    const { error } = await supabase.from('parking_vehicle_configs').insert({
      parking_lot_id: lot.id,
      vehicle_type: c.vehicle_type,
      hourly_rate: c.hourly_rate,
      total_spaces: c.total_spaces,
    });
    if (error) return fail(error);
    written = true;
  }

  const { data, error } = await supabase
    .from('parking_lots')
    .update({
      name: input.name,
      status: input.status,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone,
      contact_email: input.contact_email || null,
      opening_hours: input.opening_hours,
    })
    .eq('id', lot.id)
    .select('id');
  if (error) return fail(error);
  if (!data || data.length === 0) return fail(null, 'PERMISO_DENEGADO');

  return success(undefined);
}

/** HU6: cambia `total_spaces` solo en los tipos indicados. */
export async function configureSpaces(
  changes: { config_id: string; total_spaces: number }[],
): Promise<ParkingResult<void>> {
  const current = await getMyParkingLot();
  if (!current.ok) return current;
  if (!current.data) return failure('DATOS_INVALIDOS');

  const byId = new Map<string, VehicleConfig>(current.data.parking_vehicle_configs.map((c) => [c.id, c]));

  for (const change of changes) {
    const saved = byId.get(change.config_id);
    if (!saved) return failure('DATOS_INVALIDOS');
    if (!isCapacityValid(change.total_spaces, saved.occupied_spaces)) {
      return failure('CAPACIDAD_MENOR_A_OCUPADAS', saved.vehicle_type);
    }
  }

  for (const change of changes) {
    const { data, error } = await supabase
      .from('parking_vehicle_configs')
      .update({ total_spaces: change.total_spaces })
      .eq('id', change.config_id)
      .select('id');
    if (error) return fromBackendError(error, byId.get(change.config_id)?.vehicle_type);
    if (!data || data.length === 0) return failure('PERMISO_DENEGADO');
  }

  return success(undefined);
}

async function callOccupancy(
  fn: 'register_vehicle_entry' | 'register_vehicle_exit',
  configId: string,
): Promise<ParkingResult<number>> {
  const { data, error } = await supabase.rpc(fn, { p_vehicle_config_id: configId });
  if (error) return fromBackendError(error);
  return success(data as number);
}

/** HU7: devuelve el nuevo número de celdas ocupadas. */
export const registerEntry = (configId: string) => callOccupancy('register_vehicle_entry', configId);
export const registerExit = (configId: string) => callOccupancy('register_vehicle_exit', configId);
